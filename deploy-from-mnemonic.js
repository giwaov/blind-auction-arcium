/**
 * Stacks Contract Deployment from Mnemonic
 * Deploys all 4 contracts to Stacks Mainnet
 *
 * Usage:
 *   Copy .env.example to .env and set STACKS_MNEMONIC
 *   Run: node deploy-from-mnemonic.js
 */

const {
  makeContractDeploy,
  AnchorMode,
  PostConditionMode,
} = require("@stacks/transactions");
const fs = require("fs");
const path = require("path");

<<<<<<< Updated upstream
// Mnemonic (set via environment or replace directly for one-time use)
const MNEMONIC = process.env.STX_MNEMONIC || "REDACTED_MNEMONIC";

// Network
const network = STACKS_MAINNET;
=======
const {
  config,
  getNetwork,
  getPrimaryAccount,
  getAccountNonce,
  getAccountBalance,
  broadcastTransaction,
} = require("./lib/stacks-utils");
>>>>>>> Stashed changes

// Contract definitions (v2 - simplified for mainnet)
const contracts = [
  {
    name: "tip-jar-v2",
    path: "./stacks-tip-jar/contracts/tip-jar-v2.clar",
    description: "STX Tip Jar v2 - Accept tips",
  },
  {
    name: "voting-v2",
    path: "./stacks-voting/contracts/voting-v2.clar",
    description: "On-chain Voting v2 - Create polls and vote",
  },
  {
    name: "nft-v2",
    path: "./stacks-nft-mint/contracts/nft-v2.clar",
    description: "NFT Minting v2 - Simple NFT minting",
  },
  {
    name: "auction-v2",
    path: "./stacks-blind-auction/contracts/auction-v2.clar",
    description: "Auction v2 - Create and bid on auctions",
  },
];

async function deployContract(contractInfo, privateKey, nonce, address) {
  console.log(`\nDeploying: ${contractInfo.name}`);
  console.log(`   ${contractInfo.description}`);

  const contractPath = path.resolve(__dirname, contractInfo.path);

  if (!fs.existsSync(contractPath)) {
    console.error(`   Contract file not found: ${contractPath}`);
    return null;
  }

  const codeBody = fs.readFileSync(contractPath, "utf8");
  console.log(`   Contract size: ${codeBody.length} bytes`);

  try {
    const transaction = await makeContractDeploy({
      contractName: contractInfo.name,
      codeBody,
      senderKey: privateKey,
      network: getNetwork(),
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce,
      fee: 150000n,
    });

    const { txid, explorerUrl } = await broadcastTransaction(transaction, contractInfo.name);
    return {
      name: contractInfo.name,
      contractId: `${address}.${contractInfo.name}`,
      txid,
      explorer: explorerUrl,
    };
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    return { error: error.message };
  }
}

async function main() {
  console.log("===================================================");
  console.log("        STACKS CONTRACT DEPLOYMENT - MAINNET");
  console.log("===================================================\n");

  console.log("Deriving wallet from mnemonic...");
  const { privateKey, address } = await getPrimaryAccount();
  console.log(`Deployer Address: ${address}`);

  // Check balance
  const balanceData = await getAccountBalance(address);
  const balanceSTX = Number(balanceData.balance) / 1_000_000;
  console.log(`Balance: ${balanceSTX.toFixed(6)} STX`);

  const estimatedCost = contracts.length * 0.15;
  if (balanceSTX < estimatedCost) {
    console.error(`\nInsufficient balance! Need at least ~${estimatedCost} STX`);
    console.log(`   Current balance: ${balanceSTX.toFixed(6)} STX`);
    process.exit(1);
  }

  // Get starting nonce
  let nonce = await getAccountNonce(address);
  console.log(`Starting nonce: ${nonce}\n`);

  // Deploy contracts
  const results = [];
  for (const contract of contracts) {
    const result = await deployContract(contract, privateKey, nonce, address);
    if (result && !result.error) {
      results.push(result);
      nonce++;
    } else if (result && result.error) {
      console.log(`   Skipping to next contract...`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Summary
  console.log("\n===================================================");
  console.log("                    DEPLOYMENT SUMMARY");
  console.log("===================================================\n");

  if (results.length > 0) {
    console.log(`Successfully submitted ${results.length}/${contracts.length} contracts:\n`);
    results.forEach((r) => {
      console.log(`  ${r.name}`);
      console.log(`     Contract ID: ${r.contractId}`);
      console.log(`     TX: ${r.txid}`);
      console.log(`     Explorer: ${r.explorer}\n`);
    });

    console.log("\nNext Steps:");
    console.log("  1. Wait for transactions to confirm (~10-30 minutes)");
    console.log("  2. Update CONTRACT_ADDRESS in each project's page.tsx with the contract IDs above");
    console.log("  3. Push updates to GitHub\n");

    // Save results
    const outputFile = path.join(__dirname, "deployment-results.json");
    fs.writeFileSync(
      outputFile,
      JSON.stringify(
        {
          network: config.network,
          deployer: address,
          timestamp: new Date().toISOString(),
          contracts: results,
        },
        null,
        2
      )
    );
    console.log(`Results saved to: ${outputFile}`);
  } else {
    console.log("No contracts were deployed successfully.");
    console.log("\nCommon issues:");
    console.log("   - Insufficient STX balance for fees");
    console.log("   - Contract name already exists (try renaming)");
    console.log("   - Network congestion (try again later)");
  }
}

main().catch(console.error);
