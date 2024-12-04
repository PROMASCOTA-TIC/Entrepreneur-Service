import { Model, Column, Table, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { Category } from "./category.models";
import { Product } from "./products.models";

@Table({ tableName: 'SUBCATEGORIES', timestamps: false })
export class Subcategory extends Model {
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

    @ForeignKey(() => Category)
    @Column({
        type: DataType.STRING(36),
        allowNull: false,
        field: 'CATEGORY_ID',
    })
    categoryId: string;

    @BelongsTo(() => Category)
    category: Category;

    @HasMany(() => Product)
    products: Product[];
}
