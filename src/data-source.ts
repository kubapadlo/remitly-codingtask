import "reflect-metadata";
import { DataSource } from "typeorm";
import { BankStock } from "./entities/BankStock";
import { WalletStock } from "./entities/WalletStock";
import { AuditLog } from "./entities/AuditLog";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [BankStock, WalletStock, AuditLog],
});