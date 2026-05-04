import { Entity, PrimaryColumn, Column } from "typeorm";
@Entity()
export class WalletStock {
    @PrimaryColumn() walletId!: string;
    @PrimaryColumn() stockName!: string;
    @Column({ default: 0 }) quantity!: number;
}