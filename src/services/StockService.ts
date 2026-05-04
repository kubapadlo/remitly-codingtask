import { AppDataSource } from "../data-source";
import { BankStock } from "../entities/BankStock";

export class StockService {
    static async getAll(): Promise<BankStock[]> {
        return AppDataSource.getRepository(BankStock).find();
    }

    static async setAll(stocks: { name: string; quantity: number }[]): Promise<void> {
        await AppDataSource.transaction(async (manager) => {
            const repo = manager.getRepository(BankStock);
            await repo.clear();
            await repo.save(stocks);
        });
    }
}