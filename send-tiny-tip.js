/**
 * Send a tiny tip to the tip-jar contract
 * Amount: 1000 microSTX (0.001 STX)
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
const TIP_AMOUNT = 1000; // 0.001 STX - minimal tip

async function main() {
  console.log("Sending tiny tip to tip-jar-v3...");
  console.log(`Amount: ${TIP_AMOUNT} microSTX (${TIP_AMOUNT / 1000000} STX)\n`);

  const { privateKey, address } = await getPrimaryAccount();
  const network = getNetwork();
  const nonce = await getAccountNonce(address);

  console.log(`From: ${address}`);
  console.log(`Nonce: ${nonce}`);
  console.log(`Contract: ${CONTRACT_OWNER}.tip-jar-v3\n`);

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
    fee: 2000, // minimal fee
  });

  const result = await broadcastTransaction(tx, "tiny tip");
  
  if (result) {
    console.log("\nTip sent successfully!");
    console.log(`View on explorer: https://explorer.stacks.co/txid/${result}?chain=mainnet`);
  }
}

main().catch(console.error);
