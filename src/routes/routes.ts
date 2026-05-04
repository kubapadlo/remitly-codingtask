import { Router } from "express";
import { StockController } from "../controllers/StockController";
import { WalletController } from "../controllers/WalletController";
import { AuditLogService } from "../services/AuditLogService";

const router = Router();

// ── Bank / stocks ────────────────────────────────────────────────────────────
router.get("/stocks", StockController.getStocks);
router.post("/stocks", StockController.setStocks);

// ── Wallets ──────────────────────────────────────────────────────────────────
router.get("/wallets/:wallet_id", WalletController.getWallet);
router.get("/wallets/:wallet_id/stocks/:stock_name", WalletController.getWalletStock);
router.post("/wallets/:wallet_id/stocks/:stock_name", WalletController.tradeStock);

// ── Audit log ────────────────────────────────────────────────────────────────
router.get("/log", async (req, res) => {
    const logs = await AuditLogService.getAll();
    res.json({
        log: logs.map((l) => ({
            type: l.type,
            wallet_id: l.walletId,
            stock_name: l.stockName,
        })),
    });
});

export default router;