/**
 * Interact with Stacks contracts - more interactions
 *
 * Usage:
 *   Copy .env.example to .env and set STACKS_MNEMONIC
 *   Run: node interact-more.js
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
  const { privateKey, address } = await getPrimaryAccount();
  const network = getNetwork();

  let nonce = await getAccountNonce(address);

  console.log("Starting nonce:", nonce);
  console.log("\n=== More contract interactions ===\n");

  // 1. Vote B on poll 1
  console.log("1. Vote B on poll 1...");
  const vote1 = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "vote-b",
    functionArgs: [uintCV(1)],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(vote1, "vote-b poll 1");

  // 2. Mint NFT #2
  console.log("\n2. Minting NFT #2...");
  const mint = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "nft-v2", functionName: "mint",
    functionArgs: [],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(mint, "mint NFT #2");

  // 3. Send tip
  console.log("\n3. Sending tip...");
  const tip = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "tip-jar-v3", functionName: "tip",
    functionArgs: [uintCV(15000)],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tip, "tip");

  // 4. Create poll 3
  console.log("\n4. Creating poll 3...");
  const poll3 = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "create-poll",
    functionArgs: [stringUtf8CV("Best L2: Stacks?")],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(poll3, "create poll 3");

  // 5. Vote A on poll 2
  console.log("\n5. Vote A on poll 2...");
  const vote2 = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "vote-a",
    functionArgs: [uintCV(2)],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(vote2, "vote-a poll 2");

  console.log("\n=== Done! ===");
}

main().catch(console.error);
