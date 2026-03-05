/**
 * Send 10 tiny tips to tip-jar-v3 contract
 * Creates activity to simulate active users
 */

const {
  makeContractCall,
  AnchorMode,
  PostConditionMode,
  uintCV,
  noneCV,
  someCV,
  stringUtf8CV,
} = require("@stacks/transactions");

const {
  config,
  getNetwork,
  getPrimaryAccount,
  getAccountNonce,
  broadcastTransaction,
} = require("./lib/stacks-utils");

const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const CONTRACT_NAME = "tip-jar-v3";

const messages = [
  "Great project! 🚀",
  "Keep building!",
  "Love the UI design",
  "Supporting open source",
  "Stacks ecosystem rocks!",
  "First tip! 💎",
  "Community support",
  "Building on Bitcoin",
  "Web3 decentralization",
  "Keep shipping! 🔥",
];

async function sendTip(privateKey, nonce, amount) {
  const microSTX = Math.floor(amount * 1_000_000);
  
  const transaction = await makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "tip",
    functionArgs: [uintCV(microSTX)],
    senderKey: privateKey,
    network: getNetwork(),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    nonce,
    fee: 50000n, // 0.05 STX fee
  });

  return broadcastTransaction(transaction, `tip-${amount}-STX`);
}

async function main() {
  console.log("=== Sending 10 Tips to Tip Jar ===\n");

  const { privateKey, address } = await getPrimaryAccount();
  console.log(`Sender: ${address}\n`);

  let nonce = await getAccountNonce(address);
  console.log(`Starting nonce: ${nonce}\n`);

  const results = [];

  for (let i = 0; i < 10; i++) {
    // Tiny amounts: 0.001 to 0.01 STX
    const amount = 0.001 + (i * 0.001);

    console.log(`Tip ${i + 1}/10: ${amount.toFixed(3)} STX`);

    try {
      const result = await sendTip(privateKey, nonce, amount);
      results.push({
        index: i + 1,
        amount,
        txId: result.txid,
        status: "broadcasted",
      });
      console.log(`   TX: ${result.txid}\n`);
      nonce++;
      
      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   Error: ${error.message}\n`);
      results.push({
        index: i + 1,
        amount,
        status: "failed",
        error: error.message,
      });
    }
  }

  console.log("\n=== Summary ===");
  const successful = results.filter(r => r.status === "broadcasted");
  console.log(`Sent: ${successful.length}/10 tips`);
  console.log(`Total: ${successful.reduce((sum, r) => sum + r.amount, 0).toFixed(3)} STX`);
  
  console.log("\nTransactions:");
  successful.forEach(r => {
    console.log(`  ${r.index}. ${r.amount.toFixed(3)} STX - https://explorer.stacks.co/txid/${r.txId}?chain=mainnet`);
  });
}

main().catch(console.error);
