import { Request, Response } from "express";
import { WalletService } from "../services/WalletService";

export class WalletController {
    static async getWallet(req: Request, res: Response) {
        const wallet_id = req.params.wallet_id as string;
        const stocks = await WalletService.getWallet(wallet_id);
        res.json({ id: wallet_id, stocks });
    }

    static async getWalletStock(req: Request, res: Response) {
        const wallet_id = req.params.wallet_id as string;
        const stock_name = req.params.stock_name as string;

        const result = await WalletService.getWalletStock(wallet_id, stock_name);
        if (!result) {
            return res.status(404).json({ error: `Stock '${stock_name}' not found` });
        }
        return res.json(result.quantity);
    }

    static async tradeStock(req: Request, res: Response) {
        const wallet_id = req.params.wallet_id as string;
        const stock_name = req.params.stock_name as string;
        const { type } = req.body as { type: "buy" | "sell" };

        if (type !== "buy" && type !== "sell") {
            return res.status(400).json({ error: "type must be 'buy' or 'sell'" });
        }

        const result = await WalletService.trade(wallet_id, stock_name, type);
        if (!result.ok) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.sendStatus(200);
    }
}