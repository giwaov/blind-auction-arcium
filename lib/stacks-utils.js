/**
 * Shared Stacks Utilities
 * Common functions for Stacks blockchain interactions
 */

require('dotenv').config();

const { STACKS_MAINNET, STACKS_TESTNET, TransactionVersion } = require('@stacks/network');
const { generateWallet, getStxAddress } = require('@stacks/wallet-sdk');

// Configuration from environment
const config = {
  mnemonic: process.env.STACKS_MNEMONIC,
  network: process.env.STACKS_NETWORK || 'mainnet',
  apiUrl: process.env.STACKS_API_URL || 'https://api.mainnet.hiro.so',
  defaultFee: BigInt(process.env.STACKS_DEFAULT_FEE || '100000'),
};

/**
 * Validate that required environment variables are set
 */
function validateConfig() {
  if (!config.mnemonic) {
    throw new Error(
      'STACKS_MNEMONIC not set. Copy .env.example to .env and configure your mnemonic.'
    );
  }
  if (config.mnemonic.includes('your_') || config.mnemonic.split(' ').length < 12) {
    throw new Error(
      'STACKS_MNEMONIC appears invalid. Please set a valid 12/24 word mnemonic in .env'
    );
  }
}

/**
 * Get the appropriate network configuration
 */
function getNetwork() {
  return config.network === 'testnet' ? STACKS_TESTNET : STACKS_MAINNET;
}

/**
 * Get transaction version based on network
 */
function getTransactionVersion() {
  return config.network === 'testnet'
    ? TransactionVersion.Testnet
    : TransactionVersion.Mainnet;
}

/**
 * Generate wallet from mnemonic
 */
async function getWallet() {
  validateConfig();
  return generateWallet({ secretKey: config.mnemonic, password: '' });
}

/**
 * Get primary account from wallet
 */
async function getPrimaryAccount() {
  const wallet = await getWallet();
  const account = wallet.accounts[0];
  const address = getStxAddress({
    account,
    transactionVersion: getTransactionVersion(),
  });
  return {
    account,
    privateKey: account.stxPrivateKey,
    address,
  };
}

/**
 * Fetch account nonce from Stacks API
 */
async function getAccountNonce(address) {
  try {
    const response = await fetch(
      `${config.apiUrl}/extended/v1/address/${address}/nonces`
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return BigInt(data.possible_next_nonce);
  } catch (error) {
    console.error('Failed to fetch nonce:', error.message);
    throw error;
  }
}

/**
 * Fetch account STX balance
 */
async function getAccountBalance(address) {
  try {
    const response = await fetch(
      `${config.apiUrl}/extended/v1/address/${address}/stx`
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      balance: BigInt(data.balance),
      locked: BigInt(data.locked),
      total_sent: BigInt(data.total_sent),
      total_received: BigInt(data.total_received),
    };
  } catch (error) {
    console.error('Failed to fetch balance:', error.message);
    throw error;
  }
}

/**
 * Broadcast a signed transaction
 */
async function broadcastTransaction(transaction, name = 'Transaction') {
  const serializedTxHex = transaction.serialize();
  const serializedTx = Buffer.from(serializedTxHex, 'hex');

  const response = await fetch(`${config.apiUrl}/v2/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: serializedTx,
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { error: responseText };
    }
    const errorMsg = `${name} failed: ${JSON.stringify(errorData)}`;
    console.error(`   ❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const txid = responseText.replace(/"/g, '');
  const explorerUrl = `https://explorer.stacks.co/txid/${txid}?chain=${config.network}`;
  
  console.log(`   ✅ ${name} TX: ${txid}`);
  console.log(`      Explorer: ${explorerUrl}`);
  
  return { txid, explorerUrl };
}

/**
 * Wait for transaction confirmation
 */
async function waitForConfirmation(txid, maxAttempts = 60, intervalMs = 5000) {
  console.log(`   ⏳ Waiting for confirmation...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${config.apiUrl}/extended/v1/tx/${txid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.tx_status === 'success') {
          console.log(`   ✅ Transaction confirmed in block ${data.block_height}`);
          return data;
        }
        if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
          throw new Error(`Transaction aborted: ${data.tx_status}`);
        }
      }
    } catch (error) {
      if (error.message.includes('aborted')) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error(`Transaction ${txid} not confirmed after ${maxAttempts} attempts`);
}

module.exports = {
  config,
  validateConfig,
  getNetwork,
  getTransactionVersion,
  getWallet,
  getPrimaryAccount,
  getAccountNonce,
  getAccountBalance,
  broadcastTransaction,
  waitForConfirmation,
};
