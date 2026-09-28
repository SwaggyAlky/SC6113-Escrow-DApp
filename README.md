# SafePay Escrow DApp — SC6113 Individual Assignment

SafePay is a simple financial decentralized application that demonstrates an Ethereum escrow payment workflow.

## 1. Problem

In peer-to-peer online transactions, a buyer may not want to pay a seller before receiving goods or services, while the seller may not want to deliver without evidence that funds are available. A centralized escrow service can solve this, but it introduces a trusted intermediary.

SafePay uses an Ethereum smart contract to hold Sepolia ETH until the seller marks delivery and the buyer releases payment.

## 2. Main Features

- MetaMask wallet connection
- Ethereum Sepolia network
- Create and fund escrow transactions
- Seller marks delivery
- Buyer releases funds
- Seller can voluntarily refund buyer before release
- Smart-contract authorization and state validation
- On-chain transaction confirmation
- Etherscan transaction links
- Flask backend
- SQLite off-chain activity log
- Input validation and error handling
- Responsive web interface

## 3. Architecture

```text
Browser UI (HTML/CSS/JavaScript)
        |
        |---- MetaMask + ethers.js ----> EscrowPayment.sol ----> Ethereum Sepolia
        |
        +---- HTTP/JSON ---------------> Flask API -----------> SQLite
```

MetaMask remains responsible for private-key custody and transaction signing. The Flask backend never stores private keys.

## 4. Project Structure

```text
SC6113_Escrow_DApp/
├── contracts/
│   └── EscrowPayment.sol
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── docs/
│   ├── TESTING.md
│   └── DEMO_SCRIPT.md
└── README.md
```

## 5. Prerequisites

- Python 3.10+
- MetaMask browser extension
- Two MetaMask accounts are recommended for the demo:
  - Account A = Buyer
  - Account B = Seller
- Sepolia test ETH
- Remix IDE for contract deployment

## 6. Deploy the Smart Contract

1. Open Remix IDE.
2. Create a new file named `EscrowPayment.sol`.
3. Copy the contents of `contracts/EscrowPayment.sol`.
4. Compile with Solidity compiler `0.8.24` or a compatible `0.8.x` compiler.
5. In **Deploy & Run Transactions**, choose **Injected Provider - MetaMask**.
6. Confirm MetaMask is on the **Sepolia** network.
7. Deploy `EscrowPayment`.
8. Copy the deployed contract address.
9. Note the deployment block number from Etherscan if desired.

## 7. Configure the Backend

Open a terminal:

```bash
cd backend
python -m venv .venv
```

Activate the environment.

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env`.

Windows:

```bash
copy .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Edit `.env`:

```env
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
CHAIN_ID=11155111
CHAIN_NAME=Sepolia
EXPLORER_BASE_URL=https://sepolia.etherscan.io
DEPLOY_BLOCK=0
```

## 8. Run the DApp

From the `backend` directory:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## 9. Recommended Demo Flow

### Buyer
1. Connect MetaMask using Account A.
2. Enter Account B as the seller.
3. Enter `0.001` ETH.
4. Click **Create & Fund Escrow**.
5. Confirm the transaction in MetaMask.
6. Show the confirmed transaction and Etherscan link.

### Seller
7. Switch MetaMask to Account B.
8. Refresh/reconnect.
9. Find the escrow.
10. Click **Mark Delivered**.
11. Confirm in MetaMask.

### Buyer
12. Switch back to Account A.
13. Click **Release Funds**.
14. Confirm in MetaMask.
15. Show the final status as `Released`.

## 10. Security Design

- The buyer and seller must be different addresses.
- The escrow amount must be greater than zero.
- Only the seller can mark delivery.
- Only the buyer can release funds.
- Funds can only be released after delivery is confirmed.
- The contract changes state before sending ETH, following checks-effects-interactions.
- The application does not request or store private keys.
- MetaMask signs all blockchain transactions.
- The backend validates wallet addresses and transaction-hash formats before saving activity.

## 11. Suggested Screenshots for the Report

1. Smart contract compiled in Remix
2. Smart contract deployed to Sepolia
3. DApp home page
4. MetaMask connection
5. Create escrow form
6. MetaMask transaction confirmation
7. Etherscan confirmed transaction
8. Seller `Mark Delivered`
9. Buyer `Release Funds`
10. Final escrow status
11. Backend activity log
12. Invalid input/error example

## 12. Important Note

This project is designed for coursework demonstration on Sepolia testnet. It is not production-ready and has not undergone a professional smart-contract security audit.
