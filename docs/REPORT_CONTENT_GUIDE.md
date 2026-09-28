# Report Content Guide

## 1. Introduction
Introduce DApps, smart contracts, and the use of escrow in peer-to-peer finance.

## 2. Problem Statement
Explain the trust problem between buyer and seller and the dependency of traditional escrow on a centralized intermediary.

## 3. Objectives
- Build a working financial DApp.
- Use Solidity to lock and release Sepolia ETH.
- Integrate MetaMask.
- Provide a web interface.
- Integrate Flask backend services.
- Validate inputs and handle errors.
- Evaluate functionality and security.

## 4. System Architecture
Include a diagram showing:
User -> Frontend -> MetaMask -> Smart Contract -> Sepolia
Frontend -> Flask -> SQLite

## 5. Technologies Used
Solidity, Ethereum Sepolia, MetaMask, ethers.js, HTML/CSS/JavaScript, Flask, SQLite, Remix.

## 6. Smart Contract Design
Explain:
- Escrow struct
- Status enum
- createEscrow
- markDelivered
- releaseFunds
- refundBuyer
- modifiers and authorization
- events
- checks-effects-interactions

## 7. Application Design
Describe:
- wallet panel
- create-escrow form
- escrow history table
- contextual action buttons
- transaction-status panel
- backend activity log

## 8. Implementation
Describe the interaction flow and division between on-chain and off-chain components.

## 9. Testing and Results
Use the table in `docs/TESTING.md` and add screenshots.

## 10. Challenges Encountered
Possible points:
- switching MetaMask accounts and networks
- obtaining Sepolia test ETH
- handling asynchronous transaction confirmation
- decoding on-chain states into UI labels

## 11. Limitations
- no dispute arbitration
- ETH only
- Sepolia testnet only
- linear escrow loading is unsuitable for very large datasets
- no professional security audit

## 12. Future Improvements
- ERC-20 / stablecoin escrow
- dispute resolver / arbitrator
- event indexing service
- notifications
- stronger backend authentication
- contract upgrade strategy where appropriate

## 13. Conclusion
Summarize the complete end-to-end financial DApp and what was demonstrated.
