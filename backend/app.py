from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import os
import sqlite3
from datetime import datetime, timezone
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DB_PATH = BASE_DIR / "activity.db"

load_dotenv(BASE_DIR / ".env")

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path=""
)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                wallet TEXT NOT NULL,
                action TEXT NOT NULL,
                escrow_id TEXT,
                tx_hash TEXT,
                status TEXT NOT NULL,
                message TEXT
            )
            """
        )


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/config")
def config():
    return jsonify(
        {
            "contractAddress": os.getenv("CONTRACT_ADDRESS", ""),
            "chainId": int(os.getenv("CHAIN_ID", "11155111")),
            "chainName": os.getenv("CHAIN_NAME", "Sepolia"),
            "explorerBaseUrl": os.getenv(
                "EXPLORER_BASE_URL", "https://sepolia.etherscan.io"
            ),
            "deployBlock": int(os.getenv("DEPLOY_BLOCK", "0")),
        }
    )


@app.get("/api/activity")
def get_activity():
    wallet = request.args.get("wallet", "").strip().lower()
    limit = request.args.get("limit", "50")

    try:
        limit = max(1, min(int(limit), 100))
    except ValueError:
        limit = 50

    with get_db() as conn:
        if wallet:
            rows = conn.execute(
                """
                SELECT * FROM activity
                WHERE lower(wallet) = ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (wallet, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM activity ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()

    return jsonify([dict(row) for row in rows])


@app.post("/api/activity")
def add_activity():
    data = request.get_json(silent=True) or {}

    wallet = str(data.get("wallet", "")).strip()
    action = str(data.get("action", "")).strip()
    escrow_id = str(data.get("escrowId", "")).strip()
    tx_hash = str(data.get("txHash", "")).strip()
    status = str(data.get("status", "")).strip()
    message = str(data.get("message", "")).strip()

    if not wallet or not action or not status:
        return jsonify(
            {"error": "wallet, action and status are required"}
        ), 400

    if not wallet.startswith("0x") or len(wallet) != 42:
        return jsonify({"error": "invalid wallet address"}), 400

    if tx_hash and (not tx_hash.startswith("0x") or len(tx_hash) != 66):
        return jsonify({"error": "invalid transaction hash"}), 400

    created_at = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO activity
            (created_at, wallet, action, escrow_id, tx_hash, status, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                created_at,
                wallet,
                action,
                escrow_id,
                tx_hash,
                status,
                message,
            ),
        )
        activity_id = cur.lastrowid

    return jsonify({"ok": True, "id": activity_id}), 201


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)