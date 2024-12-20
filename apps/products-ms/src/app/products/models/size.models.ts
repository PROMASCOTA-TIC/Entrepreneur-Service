import { Model, Column, Table, DataType, HasMany } from "sequelize-typescript";
import { Product } from "./products.models";

@Table({ tableName: 'SIZES', timestamps: false })
export class Size extends Model {
    @Column({
        type: DataType.STRING(5),
        primaryKey: true,
        allowNull: false,
        field: 'ID',
    })
    id: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        field: 'NAME',
    })
    name: string;

    @HasMany(() => Product)
    products: Product[];
}
