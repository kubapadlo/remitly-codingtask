import { AppDataSource } from "../data-source";
import { BankStock } from "../entities/BankStock";
import { WalletStock } from "../entities/WalletStock";
import { AuditLogService } from "./AuditLogService";

export type TradeResult =
    | { ok: true }
    | { ok: false; status: 400 | 404; error: string };

export class WalletService {
    static async getWallet(walletId: string): Promise<{ name: string; quantity: number }[]> {
        const stocks = await AppDataSource.getRepository(WalletStock).find({
            where: { walletId },
        });
        return stocks.map((s) => ({ name: s.stockName, quantity: s.quantity }));
    }

    static async getWalletStock(
        walletId: string,
        stockName: string
    ): Promise<{ quantity: number } | null> {
        const bankStock = await AppDataSource.getRepository(BankStock).findOneBy({
            name: stockName,
        });
        if (!bankStock) return null;

        const walletStock = await AppDataSource.getRepository(WalletStock).findOneBy({
            walletId,
            stockName,
        });
        return { quantity: walletStock?.quantity ?? 0 };
    }

    static async trade(
        walletId: string,
        stockName: string,
        type: "buy" | "sell"
    ): Promise<TradeResult> {
        let result: TradeResult = { ok: false, status: 400, error: "Unknown error" };

        await AppDataSource.transaction(async (manager) => {
            const bankRepo = manager.getRepository(BankStock);
            const walletRepo = manager.getRepository(WalletStock);

            const bankStock = await bankRepo.findOneBy({ name: stockName });
            if (!bankStock) {
                result = { ok: false, status: 404, error: `Stock '${stockName}' not found` };
                return;
            }

            if (type === "buy") {
                if (bankStock.quantity < 1) {
                    result = { ok: false, status: 400, error: `No '${stockName}' available in the bank` };
                    return;
                }

                bankStock.quantity -= 1;
                await bankRepo.save(bankStock);

                let walletStock = await walletRepo.findOneBy({ walletId, stockName });
                if (!walletStock) {
                    walletStock = walletRepo.create({ walletId, stockName, quantity: 0 });
                }
                walletStock.quantity += 1;
                await walletRepo.save(walletStock);
            } else {
                const walletStock = await walletRepo.findOneBy({ walletId, stockName });
                if (!walletStock || walletStock.quantity < 1) {
                    result = { ok: false, status: 400, error: `Wallet '${walletId}' has no '${stockName}' to sell` };
                    return;
                }

                walletStock.quantity -= 1;
                await walletRepo.save(walletStock);

                bankStock.quantity += 1;
                await bankRepo.save(bankStock);
            }

            await AuditLogService.record(manager, type, walletId, stockName);
            result = { ok: true };
        });

        return result;
    }
}