const ABI = [
  "function createEscrow(address seller) payable returns (uint256 escrowId)",
  "function markDelivered(uint256 escrowId)",
  "function releaseFunds(uint256 escrowId)",
  "function refundBuyer(uint256 escrowId)",
  "function getEscrow(uint256 escrowId) view returns (address buyer,address seller,uint256 amount,uint8 status,uint256 createdAt)",
  "function nextEscrowId() view returns (uint256)",
  "event EscrowCreated(uint256 indexed escrowId,address indexed buyer,address indexed seller,uint256 amount)",
  "event DeliveryConfirmed(uint256 indexed escrowId,address indexed seller)",
  "event FundsReleased(uint256 indexed escrowId,address indexed buyer,address indexed seller,uint256 amount)",
  "event Refunded(uint256 indexed escrowId,address indexed seller,address indexed buyer,uint256 amount)"
];

const STATUS_NAMES = ["None", "Funded", "Delivered", "Released", "Refunded"];

let config = null;
let provider = null;
let signer = null;
let contract = null;
let currentWallet = null;

const connectBtn = document.getElementById("connectBtn");
const refreshBtn = document.getElementById("refreshBtn");
const createForm = document.getElementById("createForm");
const sellerInput = document.getElementById("sellerInput");
const amountInput = document.getElementById("amountInput");
const walletText = document.getElementById("walletText");
const networkText = document.getElementById("networkText");
const balanceText = document.getElementById("balanceText");
const statusBox = document.getElementById("statusBox");
const txLinkWrap = document.getElementById("txLinkWrap");
const txLink = document.getElementById("txLink");
const escrowRows = document.getElementById("escrowRows");
const activityList = document.getElementById("activityList");

function shortAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function setStatus(message, type = "idle", txHash = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;

  if (txHash && config?.explorerBaseUrl) {
    txLink.href = `${config.explorerBaseUrl}/tx/${txHash}`;
    txLinkWrap.classList.remove("hidden");
  } else {
    txLinkWrap.classList.add("hidden");
  }
}

async function loadConfig() {
  const res = await fetch("/api/config");
  config = await res.json();

  if (!config.contractAddress) {
    setStatus(
      "Contract address is not configured. Deploy EscrowPayment.sol, then add CONTRACT_ADDRESS to backend/.env.",
      "error"
    );
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("MetaMask was not detected. Install the MetaMask browser extension first.", "error");
    return;
  }

  if (!config) await loadConfig();
  if (!config.contractAddress || !ethers.isAddress(config.contractAddress)) {
    setStatus("A valid contract address must be configured before connecting.", "error");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== Number(config.chainId)) {
      setStatus(`Wrong network. Please switch MetaMask to ${config.chainName}.`, "error");
      networkText.textContent = `Wrong network (${network.chainId})`;
      return;
    }

    signer = await provider.getSigner();
    currentWallet = await signer.getAddress();
    contract = new ethers.Contract(config.contractAddress, ABI, signer);

    const balance = await provider.getBalance(currentWallet);

    walletText.textContent = shortAddress(currentWallet);
    networkText.textContent = `${config.chainName} (${config.chainId})`;
    balanceText.textContent = `${Number(ethers.formatEther(balance)).toFixed(4)} ETH`;
    connectBtn.textContent = "Connected";
    connectBtn.disabled = true;

    setStatus("Wallet connected. You can create or manage escrows.", "success");
    await refreshAll();
  } catch (err) {
    setStatus(normalizeError(err), "error");
  }
}

function normalizeError(err) {
  const raw =
    err?.shortMessage ||
    err?.reason ||
    err?.info?.error?.message ||
    err?.message ||
    "Unknown error";

  if (String(raw).includes("user rejected")) return "Transaction was rejected in MetaMask.";
  if (String(raw).includes("insufficient funds")) return "Insufficient Sepolia ETH for this transaction and gas.";
  return String(raw).replace(/^execution reverted:\s*/i, "");
}

async function logActivity({ action, escrowId = "", txHash = "", status, message = "" }) {
  if (!currentWallet) return;

  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet: currentWallet,
        action,
        escrowId: String(escrowId),
        txHash,
        status,
        message
      })
    });
  } catch (e) {
    console.warn("Could not write backend activity log:", e);
  }
}

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contract || !currentWallet) {
    setStatus("Connect MetaMask first.", "error");
    return;
  }

  const seller = sellerInput.value.trim();
  const amount = amountInput.value.trim();

  if (!ethers.isAddress(seller)) {
    setStatus("Enter a valid seller Ethereum address.", "error");
    return;
  }

  if (seller.toLowerCase() === currentWallet.toLowerCase()) {
    setStatus("Buyer and seller must use different wallet addresses.", "error");
    return;
  }

  if (!amount || Number(amount) <= 0) {
    setStatus("Amount must be greater than zero.", "error");
    return;
  }

  try {
    setStatus("Waiting for MetaMask confirmation...", "pending");

    const tx = await contract.createEscrow(seller, {
      value: ethers.parseEther(amount)
    });

    setStatus("Transaction submitted. Waiting for blockchain confirmation...", "pending", tx.hash);
    await logActivity({
      action: "CREATE_ESCROW",
      txHash: tx.hash,
      status: "SUBMITTED",
      message: `${amount} ETH to ${seller}`
    });

    const receipt = await tx.wait();

    let createdId = "";
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "EscrowCreated") {
          createdId = parsed.args.escrowId.toString();
          break;
        }
      } catch (_) {}
    }

    await logActivity({
      action: "CREATE_ESCROW",
      escrowId: createdId,
      txHash: tx.hash,
      status: "CONFIRMED",
      message: `${amount} ETH locked in escrow`
    });

    setStatus(
      createdId
        ? `Escrow #${createdId} created and funded successfully.`
        : "Escrow created and funded successfully.",
      "success",
      tx.hash
    );

    sellerInput.value = "";
    amountInput.value = "";
    await refreshAll();
  } catch (err) {
    const message = normalizeError(err);
    setStatus(message, "error");
    await logActivity({
      action: "CREATE_ESCROW",
      status: "FAILED",
      message
    });
  }
});

async function runEscrowAction(action, escrowId) {
  if (!contract) return;

  const labels = {
    deliver: "MARK_DELIVERED",
    release: "RELEASE_FUNDS",
    refund: "REFUND_BUYER"
  };

  try {
    setStatus("Waiting for MetaMask confirmation...", "pending");

    let tx;
    if (action === "deliver") tx = await contract.markDelivered(escrowId);
    if (action === "release") tx = await contract.releaseFunds(escrowId);
    if (action === "refund") tx = await contract.refundBuyer(escrowId);

    if (!tx) throw new Error("Unknown action");

    setStatus("Transaction submitted. Waiting for confirmation...", "pending", tx.hash);
    await logActivity({
      action: labels[action],
      escrowId,
      txHash: tx.hash,
      status: "SUBMITTED"
    });

    await tx.wait();

    await logActivity({
      action: labels[action],
      escrowId,
      txHash: tx.hash,
      status: "CONFIRMED"
    });

    setStatus(`Escrow #${escrowId} updated successfully.`, "success", tx.hash);
    await refreshAll();
  } catch (err) {
    const message = normalizeError(err);
    setStatus(message, "error");
    await logActivity({
      action: labels[action] || "UNKNOWN",
      escrowId,
      status: "FAILED",
      message
    });
  }
}

async function loadEscrows() {
  if (!contract || !currentWallet) {
    escrowRows.innerHTML = `<tr><td colspan="7" class="empty">No wallet connected.</td></tr>`;
    return;
  }

  try {
    const nextId = Number(await contract.nextEscrowId());
    const rows = [];

    for (let id = 1; id < nextId; id++) {
      const e = await contract.getEscrow(id);
      const buyer = e.buyer;
      const seller = e.seller;

      if (
        buyer.toLowerCase() !== currentWallet.toLowerCase() &&
        seller.toLowerCase() !== currentWallet.toLowerCase()
      ) continue;

      const role =
        buyer.toLowerCase() === currentWallet.toLowerCase() ? "Buyer" : "Seller";

      const counterparty = role === "Buyer" ? seller : buyer;
      const status = Number(e.status);
      const created = new Date(Number(e.createdAt) * 1000).toLocaleString();

      let actions = "";
      if (role === "Seller" && status === 1) {
        actions += `<button class="btn small primary" data-action="deliver" data-id="${id}">Mark Delivered</button>`;
        actions += `<button class="btn small secondary" data-action="refund" data-id="${id}">Refund</button>`;
      }
      if (role === "Seller" && status === 2) {
        actions += `<button class="btn small secondary" data-action="refund" data-id="${id}">Refund</button>`;
      }
      if (role === "Buyer" && status === 2) {
        actions += `<button class="btn small primary" data-action="release" data-id="${id}">Release Funds</button>`;
      }

      if (!actions) actions = `<span class="muted">No action</span>`;

      rows.push(`
        <tr>
          <td>#${id}</td>
          <td>${role}</td>
          <td title="${counterparty}">${shortAddress(counterparty)}</td>
          <td>${ethers.formatEther(e.amount)} ETH</td>
          <td><span class="badge">${STATUS_NAMES[status]}</span></td>
          <td>${created}</td>
          <td><div class="action-group">${actions}</div></td>
        </tr>
      `);
    }

    escrowRows.innerHTML = rows.length
      ? rows.join("")
      : `<tr><td colspan="7" class="empty">No escrows found for this wallet.</td></tr>`;

    escrowRows.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        runEscrowAction(btn.dataset.action, btn.dataset.id);
      });
    });
  } catch (err) {
    escrowRows.innerHTML = `<tr><td colspan="7" class="empty">${normalizeError(err)}</td></tr>`;
  }
}

async function loadActivity() {
  if (!currentWallet) {
    activityList.innerHTML = `<div class="empty">No activity yet.</div>`;
    return;
  }

  try {
    const res = await fetch(`/api/activity?wallet=${encodeURIComponent(currentWallet)}&limit=20`);
    const items = await res.json();

    if (!items.length) {
      activityList.innerHTML = `<div class="empty">No activity yet.</div>`;
      return;
    }

    activityList.innerHTML = items.map((item) => {
      const tx = item.tx_hash
        ? `<a href="${config.explorerBaseUrl}/tx/${item.tx_hash}" target="_blank" rel="noreferrer">transaction</a>`
        : "no transaction hash";

      return `
        <div class="activity-item">
          <strong>${item.action}</strong> · ${item.status}
          ${item.escrow_id ? ` · Escrow #${item.escrow_id}` : ""}
          <div class="meta">${new Date(item.created_at).toLocaleString()} · ${tx}${item.message ? ` · ${item.message}` : ""}</div>
        </div>
      `;
    }).join("");
  } catch (err) {
    activityList.innerHTML = `<div class="empty">Could not load backend activity.</div>`;
  }
}

async function refreshAll() {
  await Promise.all([loadEscrows(), loadActivity()]);
  if (provider && currentWallet) {
    const balance = await provider.getBalance(currentWallet);
    balanceText.textContent = `${Number(ethers.formatEther(balance)).toFixed(4)} ETH`;
  }
}

connectBtn.addEventListener("click", connectWallet);
refreshBtn.addEventListener("click", refreshAll);

window.addEventListener("load", loadConfig);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
