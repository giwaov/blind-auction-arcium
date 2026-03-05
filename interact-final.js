/**
 * Interact with Stacks contracts - final batch
 *
 * Usage:
 *   Copy .env.example to .env and set STACKS_MNEMONIC
 *   Run: node interact-final.js
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
  stringUtf8CV,
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

  // Create poll 4
  console.log("\n1. Creating poll 4...");
  let tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "create-poll",
    functionArgs: [stringUtf8CV("DeFi or NFTs?")],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "poll 4");

  // Vote B on poll 3
  console.log("\n2. Vote B on poll 3...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "vote-b",
    functionArgs: [uintCV(3)],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "vote-b poll3");

  // Mint NFT #4
  console.log("\n3. Minting NFT #4...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "nft-v2", functionName: "mint",
    functionArgs: [],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "mint #4");

  // Tip #5
  console.log("\n4. Sending tip...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "tip-jar-v3", functionName: "tip",
    functionArgs: [uintCV(30000)],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "tip #5");

  // Vote A on poll 4
  console.log("\n5. Vote A on poll 4...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "vote-a",
    functionArgs: [uintCV(4)],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "vote-a poll4");

  // Mint NFT #5
  console.log("\n6. Minting NFT #5...");
  tx = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "nft-v2", functionName: "mint",
    functionArgs: [],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tx, "mint #5");

  console.log("\nDone! Final batch complete.");
}

main().catch(console.error);
