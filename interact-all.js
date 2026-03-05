/**
 * Interact with all deployed Stacks contracts
 *
 * Usage:
 *   Copy .env.example to .env and set STACKS_MNEMONIC
 *   Run: node interact-all.js
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
  stringAsciiCV,
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

  console.log("Nonce:", nonce);
  console.log("\n=== Interacting with deployed contracts ===\n");

  // 1. Send a tip (tip-jar-v3) - 0.01 STX
  console.log("1. Sending tip...");
  const tip = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "tip-jar-v3", functionName: "tip",
    functionArgs: [uintCV(10000)],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(tip, "tip");

  await new Promise(r => setTimeout(r, 1500));

  // 2. Create another poll (voting-v2)
  console.log("\n2. Creating poll...");
  const poll = await makeContractCall({
    contractAddress: CONTRACT_OWNER, contractName: "voting-v2", functionName: "create-poll",
    functionArgs: [stringUtf8CV("Stacks vs Lightning?")],
    senderKey: privateKey, network, anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
  });
  await broadcastTransaction(poll, "create-poll");

  await new Promise(r => setTimeout(r, 1500));

  // 3. Create auction (auction-v3)
  console.log("\n3. Creating auction...");
  try {
    const auction = await makeContractCall({
      contractAddress: CONTRACT_OWNER, contractName: "auction-v3", functionName: "create-auction",
      functionArgs: [stringAsciiCV("Digital Art"), uintCV(500000), uintCV(100)],
      senderKey: privateKey, network, anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow, nonce: nonce++, fee: config.defaultFee,
    });
    await broadcastTransaction(auction, "create-auction");
  } catch (e) { console.log("auction-v3 not ready yet:", e.message); }

  console.log("\n=== Done! ===");
}

main().catch(console.error);
