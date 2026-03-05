/**
 * Interact with Deployed Stacks Contracts
 * Generates on-chain activity for all 4 contracts
 */

const {
  makeContractCall,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
  stringAsciiCV,
  listCV,
  bufferCV,
} = require("@stacks/transactions");
const crypto = require("crypto");

<<<<<<< Updated upstream
// Config
const MNEMONIC = "REDACTED_MNEMONIC";
const CONTRACT_OWNER = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const network = STACKS_MAINNET;
=======
// Shared utilities
const {
  config,
  getNetwork,
  getPrimaryAccount,
  getAccountNonce,
  broadcastTransaction,
} = require("./lib/stacks-utils");
>>>>>>> Stashed changes

// Contract owner address - update this after deployment
const CONTRACT_OWNER = process.env.STACKS_CONTRACT_OWNER || "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("        INTERACT WITH DEPLOYED CONTRACTS");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Get wallet from shared utils
  const { privateKey, address } = await getPrimaryAccount();
  const network = getNetwork();

  console.log(`🔑 Address: ${address}\n`);

  let nonce = await getAccountNonce(address);
  console.log(`📊 Starting nonce: ${nonce}\n`);

  const results = [];

  // 1. Create a Poll (voting contract)
  console.log("📦 1. Creating a poll on voting contract...");
  try {
    const pollTx = await makeContractCall({
      contractAddress: CONTRACT_OWNER,
      contractName: "voting",
      functionName: "create-poll",
      functionArgs: [
        stringUtf8CV("Best Bitcoin L2?"),
        stringUtf8CV("Vote for your favorite Bitcoin Layer 2 solution"),
        listCV([
          stringUtf8CV("Stacks"),
          stringUtf8CV("Lightning"),
          stringUtf8CV("RSK"),
        ]),
        uintCV(1000), // duration in blocks (~7 days)
      ],
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce: nonce++,
      fee: config.defaultFee,
    });
    const { txid } = await broadcastTransaction(pollTx, "create-poll");
    results.push({ contract: "voting", action: "create-poll", txid });
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}`);
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 2. Mint an NFT (nft-mint contract)
  console.log("\n📦 2. Minting an NFT...");
  try {
    const mintTx = await makeContractCall({
      contractAddress: CONTRACT_OWNER,
      contractName: "nft-mint",
      functionName: "mint",
      functionArgs: [],
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce: nonce++,
      fee: config.defaultFee,
    });
    const { txid } = await broadcastTransaction(mintTx, "mint");
    results.push({ contract: "nft-mint", action: "mint", txid });
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}`);
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 3. Send a Tip (tip-jar contract)
  console.log("\n📦 3. Sending a tip...");
  try {
    const tipTx = await makeContractCall({
      contractAddress: CONTRACT_OWNER,
      contractName: "tip-jar",
      functionName: "tip",
      functionArgs: [
        uintCV(100000), // 0.1 STX
        stringUtf8CV("Great work on these contracts!"),
      ],
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce: nonce++,
      fee: config.defaultFee,
    });
    const { txid } = await broadcastTransaction(tipTx, "tip");
    results.push({ contract: "tip-jar", action: "tip", txid });
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}`);
  }

  await new Promise((r) => setTimeout(r, 2000));

  // 4. Create an Auction (blind-auction contract)
  console.log("\n📦 4. Creating a blind auction...");
  try {
    const auctionTx = await makeContractCall({
      contractAddress: CONTRACT_OWNER,
      contractName: "blind-auction",
      functionName: "create-auction",
      functionArgs: [
        stringAsciiCV("Rare Digital Collectible"),
        stringUtf8CV("A unique on-chain collectible item"),
        uintCV(1000000), // 1 STX minimum bid
        uintCV(500), // commit duration (~3.5 days)
        uintCV(200), // reveal duration (~1.5 days)
      ],
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce: nonce++,
      fee: config.defaultFee,
    });
    const { txid } = await broadcastTransaction(auctionTx, "create-auction");
    results.push({ contract: "blind-auction", action: "create-auction", txid });
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}`);
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                    ACTIVITY SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  if (results.length > 0) {
    console.log(`✅ Successfully submitted ${results.length} contract interactions:\n`);
    results.forEach((r) => {
      console.log(`  📦 ${r.contract}.${r.action}`);
      console.log(`     TX: ${r.txid}\n`);
    });
    console.log("⏳ Wait ~10-30 minutes for transactions to confirm.");
  } else {
    console.log("❌ No transactions were submitted successfully.");
  }
}

main().catch(console.error);
