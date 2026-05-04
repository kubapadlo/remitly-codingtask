import { Request, Response } from "express";
import { StockService } from "../services/StockService";

export class StockController {
    static async getStocks(req: Request, res: Response) {
        const stocks = await StockService.getAll();
        res.json({ stocks });
    }

    static async setStocks(req: Request, res: Response) {
        await StockService.setAll(req.body.stocks);
        res.sendStatus(200);
    }
}