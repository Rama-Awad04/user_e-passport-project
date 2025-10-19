// scripts/readReceipt.js
require('dotenv').config();
const { ethers } = require('ethers');

if (!process.argv[2]) {
  console.error("Usage: node scripts/readReceipt.js <txHash>");
  process.exit(1);
}
const txHash = process.argv[2];

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contractAddress = process.env.ANCHOR_CONTRACT_ADDRESS;

  // ABI صغير فقط لِـ parsing
  const abi = [
    "event Anchored(bytes32 indexed hash, address indexed poster, uint256 timestamp, string referenceURI)"
  ];
  const contractIface = new ethers.utils.Interface(abi);

  // جلب receipt
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    console.log("Receipt not found. هل أنت متأكد من الـ txHash وRPC_URL؟");
    return;
  }
  console.log("Transaction found. blockNumber:", receipt.blockNumber);

  // فحص كل log في الـ receipt
  for (const log of receipt.logs) {
    // نتحقق إذا الـ log يخص العقد المراد (optional)
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
      // تجاهل لو ليس من عقدنا
      continue;
    }
    try {
      const parsed = contractIface.parseLog(log);
      console.log("Event name:", parsed.name);
      console.log("Args:");
      console.log("  hash:", parsed.args.hash);
      console.log("  poster:", parsed.args.poster);
      // timestamp is uint in event args (if you emitted it)
      console.log("  timestamp:", parsed.args.timestamp.toString());
      console.log("  referenceURI:", parsed.args.referenceURI);
    } catch (err) {
      // لو log ليس من نفس الـ ABI سيتسبب parseLog في error — نتجاهله
      // console.error("parse error", err);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
