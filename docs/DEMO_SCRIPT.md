# 5–8 Minute Demo Script

## 0:00–0:45 — Problem and Idea
“This project is SafePay, a financial DApp for peer-to-peer escrow payments. The problem is that a buyer may not trust a seller enough to pay before delivery, while a seller may not want to deliver without evidence that funds exist. SafePay uses a smart contract as the escrow mechanism.”

## 0:45–1:30 — Architecture
“The frontend is built with HTML, CSS, and JavaScript. MetaMask manages the user wallet and signs transactions. The Solidity smart contract runs on Ethereum Sepolia and holds the funds. A Flask backend records off-chain transaction status information in SQLite. Private keys are never stored by the application.”

## 1:30–2:20 — Smart Contract
“Each escrow stores the buyer, seller, amount, status, and creation time. The states are Funded, Delivered, Released, and Refunded. Only the seller can mark delivery, and only the buyer can release payment. The contract also validates that the amount is greater than zero and that buyer and seller are different addresses.”

## 2:20–3:30 — Create Escrow
“Now I connect the buyer wallet. I enter the seller address and 0.001 Sepolia ETH. MetaMask asks me to confirm the transaction. After confirmation, the DApp displays the transaction status and the escrow appears in the table as Funded.”

## 3:30–4:30 — Seller Confirms Delivery
“I switch to the seller account. The same escrow appears with the Seller role. The seller can mark the order as delivered. This transaction is again signed through MetaMask. After confirmation, the status becomes Delivered.”

## 4:30–5:30 — Buyer Releases Funds
“I switch back to the buyer. Because delivery is confirmed, the Release Funds button is now available. After confirming the transaction, the smart contract transfers the locked ETH to the seller and the state becomes Released.”

## 5:30–6:20 — Backend and History
“The Flask backend records submitted and confirmed actions. The page shows an off-chain activity log with transaction hashes, while the actual transfer and escrow state remain on-chain.”

## 6:20–7:00 — Error Handling and Security
“The application validates Ethereum addresses and positive amounts. The contract enforces role-based authorization and transaction state. MetaMask protects the private key because the DApp never receives it. State is updated before ETH is transferred, following the checks-effects-interactions pattern.”

## 7:00–7:30 — Limitations and Conclusion
“This prototype is designed for Sepolia testnet and coursework demonstration. A production version would need stronger dispute resolution, professional security auditing, richer indexing, and possibly stablecoin support. The project demonstrates the full DApp flow from web interface to wallet, smart contract, blockchain transaction, backend, and transaction history.”
