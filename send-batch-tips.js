/**
 * Send multiple tiny tips to tip-jar contract with proper nonce handling
 */

const {
  makeContractCall,
  AnchorMode,
  PostConditionMode,
  uintCV,
} = require("@stacks/transactions");

const {
  getNetwork,
  getPrimaryAccount,
  getAccountNonce,
  broadcastTransaction,
} = require("./lib/stacks-utils");

const CONTRACT_OWNER = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const TIP_AMOUNT = 1000; // 0.001 STX
const NUM_TIPS = parseInt(process.argv[2]) || 5;

async function main() {
  console.log(`Sending ${NUM_TIPS} tiny tips to tip-jar-v3...`);
  console.log(`Amount per tip: ${TIP_AMOUNT} microSTX (${TIP_AMOUNT / 1000000} STX)\n`);

  const { privateKey, address } = await getPrimaryAccount();
  const network = getNetwork();
  let nonce = await getAccountNonce(address);

  console.log(`From: ${address}`);
  console.log(`Starting nonce: ${nonce}\n`);

  for (let i = 1; i <= NUM_TIPS; i++) {
    console.log(`--- Tip ${i}/${NUM_TIPS} (nonce: ${nonce}) ---`);
    
    const tx = await makeContractCall({
      contractAddress: CONTRACT_OWNER,
      contractName: "tip-jar-v3",
      functionName: "tip",
      functionArgs: [uintCV(TIP_AMOUNT)],
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce: nonce,
      fee: 2000,
    });

    await broadcastTransaction(tx, `tip ${i}`);
    nonce++; // Increment nonce for next tx
  }

  console.log(`\nDone! Sent ${NUM_TIPS} tips.`);
}

main().catch(console.error);
