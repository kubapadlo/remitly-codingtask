import { Entity, PrimaryColumn, Column } from "typeorm";
@Entity()
export class BankStock {
    @PrimaryColumn() name!: string;
    @Column() quantity!: number;
}