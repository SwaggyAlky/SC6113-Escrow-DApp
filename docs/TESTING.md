# Testing Plan

Use two MetaMask accounts on Ethereum Sepolia.

| Test ID | Test Case | Input / Action | Expected Result |
|---|---|---|---|
| T01 | Wallet connection | Connect MetaMask on Sepolia | Wallet address, network, and balance are shown |
| T02 | Wrong network | Connect on another chain | DApp asks user to switch to Sepolia |
| T03 | Invalid seller | Enter malformed address | Frontend rejects input before transaction |
| T04 | Same buyer/seller | Enter connected wallet as seller | Frontend and contract reject the request |
| T05 | Zero amount | Enter 0 ETH | Frontend/contract rejects the request |
| T06 | Create escrow | Buyer sends 0.001 ETH | Transaction confirms and status becomes Funded |
| T07 | Unauthorized delivery | Buyer calls markDelivered | Smart contract reverts |
| T08 | Seller confirms delivery | Seller clicks Mark Delivered | Status becomes Delivered |
| T09 | Unauthorized release | Seller attempts release | Smart contract reverts |
| T10 | Buyer releases funds | Buyer clicks Release Funds | Seller receives ETH; status becomes Released |
| T11 | Seller refund | Seller refunds before release | Buyer receives ETH; status becomes Refunded |
| T12 | Repeat release | Buyer tries to release again | Smart contract reverts |
| T13 | Backend logging | Confirm transaction | Activity appears in Flask/SQLite history |
| T14 | MetaMask rejection | Reject signature | UI displays transaction rejected |
| T15 | Insufficient balance | Try amount above balance | UI displays insufficient funds error |

## Evidence to Capture

For the final report, capture screenshots of:
- Contract compilation and deployment
- Connected wallet
- Successful escrow creation
- Etherscan transaction confirmation
- Delivery confirmation
- Funds release
- Invalid-input rejection
- Unauthorized action rejection
- Backend activity history
