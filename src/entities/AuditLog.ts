import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn() id!: number;
    @Column() type!: string;
    @Column() walletId!: string;
    @Column() stockName!: string;
    @CreateDateColumn() createdAt!: Date;
}