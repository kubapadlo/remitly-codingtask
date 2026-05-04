import { AppDataSource } from "../data-source";
import { AuditLog } from "../entities/AuditLog";
import { EntityManager } from "typeorm";

export class AuditLogService {
    static async getAll(): Promise<AuditLog[]> {
        return AppDataSource.getRepository(AuditLog).find({ order: { id: "ASC" } });
    }

    static async record(
        manager: EntityManager,
        type: "buy" | "sell",
        walletId: string,
        stockName: string
    ): Promise<void> {
        const repo = manager.getRepository(AuditLog);
        const entry = repo.create({ type, walletId, stockName });
        await repo.save(entry);
    }
}