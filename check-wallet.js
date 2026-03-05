const addr = 'SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY';

(async () => {
  try {
    // Get balance
    const bal = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${addr}/balances`).then(r => r.json());
    console.log('=== WALLET STATUS ===');
    console.log('Address:', addr);
    console.log('STX Balance:', (Number(bal.stx.balance)/1e6).toFixed(6), 'STX');
    
    // Get recent transactions
    const txs = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${addr}/transactions?limit=20`).then(r => r.json());
    console.log('\n=== LAST 20 TRANSACTIONS ===');
    
    let totalOut = 0;
    let totalIn = 0;
    
    txs.results.forEach((tx, i) => {
      const time = new Date(tx.burn_block_time * 1000).toLocaleString();
      const status = tx.tx_status;
      let info = tx.tx_type;
      
      if (tx.tx_type === 'token_transfer') {
        const amt = Number(tx.token_transfer?.amount || 0)/1e6;
        const to = tx.token_transfer?.recipient_address || '';
        const from = tx.sender_address;
        
        if (from === addr) {
          totalOut += amt;
          info = `SENT ${amt.toFixed(4)} STX -> ${to.slice(0, 15)}...`;
        } else {
          totalIn += amt;
          info = `RECEIVED ${amt.toFixed(4)} STX from ${from.slice(0, 15)}...`;
        }
      } else if (tx.tx_type === 'contract_call') {
        info = `${tx.contract_call?.function_name}() on ${tx.contract_call?.contract_id?.split('.')[1]}`;
        // Check for STX transfers in contract calls
        if (tx.stx_sent) {
          totalOut += Number(tx.stx_sent) / 1e6;
        }
      }
      
      console.log(`${i+1}. [${status}] ${info}`);
      console.log(`   ${time} | Fee: ${(Number(tx.fee_rate)/1e6).toFixed(6)} STX`);
      console.log(`   TX: ${tx.tx_id.slice(0,20)}...`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log('Total sent out:', totalOut.toFixed(4), 'STX');
    console.log('Total received:', totalIn.toFixed(4), 'STX');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
