/**
 * Interact with Stacks contracts - batch 3
 *
 * Usage:
 *   Copy .env.example to .env and set STACKS_MNEMONIC
 *   Run: node interact-batch3.js
 */

<<<<<<< Updated upstream
const MNEMONIC = "REDACTED_MNEMONIC";
const ADDR = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
=======
const {
  makeContractCall,
  AnchorMode,
  PostConditionMode,
  uintCV,
} = require("@stacks/transactions");
>>>>>>> Stashed changes

const {
  config,
  getNetwork,
  getPrimaryAccount,
  getAccountNonce,
  broadcastTransaction,
} = require("./lib/stacks-utils");

const CONTRACT_OWNER = process.env.STACKS_CONTRACT_OWNER || "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";

async function main() {
  const { privateKey } = await getPrimaryAccount();
  const network = getNetwork();

  let nonce = await getAccountNonce(CONTRACT_OWNER);
  console.log("Starting nonce:", nonce);

  // 1. Mint NFT #3
  console.log("\n1. Minting NFT #3...");
  let tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "nft-v2", functionName: "mint",
    functionArgs: [], senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "mint #3");

  // 2. Vote B on poll 2
  console.log("\n2. Vote B on poll 2...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "vote-b",
    functionArgs: [uintCV(2)], senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "vote-b #2");

  // 3. Vote A on poll 3
  console.log("\n3. Vote A on poll 3...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "vote-a",
    functionArgs: [uintCV(3)], senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "vote-a #3");

  // 4. Send tip
  console.log("\n4. Sending tip...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "tip-jar-v3", functionName: "tip",
    functionArgs: [uintCV(25000)], senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "tip #4");

  console.log("\nDone!");
}

main().catch(console.error);
