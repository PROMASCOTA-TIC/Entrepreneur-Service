import { Model, Column, Table, DataType, HasMany } from "sequelize-typescript";
import { Product } from "./products.models";
import { Subcategory } from "./subcategory.models";


@Table({ tableName: 'CATEGORIES', timestamps: false })
export class Category extends Model {
    @Column({
        type: DataType.STRING(36),
        primaryKey: true,
        allowNull: false,
        field: 'ID',
    })
    id: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        field: 'NAME',
    })
    name: string;

    @HasMany(() => Subcategory)
    subcategories: Subcategory[];

    @HasMany(() => Product)
    products: Product[];
}
