import { Model, Column, Table, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { PetType } from "./pettype.models";
import { Category } from "./category.models";
import { Subcategory } from "./subcategory.models";
import { Size } from "./size.models";


@Table({ tableName: 'PRODUCTS', timestamps: false })
export class Product extends Model {
    @Column({
        type: DataType.STRING(36), // ID único del producto
        primaryKey: true,
        allowNull: false,
        field: 'ID',
    })
    id: string;

    @Column({
        type: DataType.CHAR(1), // '0' para Servicio, '1' para Producto
        allowNull: false,
        field: 'PUBLICATION_TYPE',
    })
    publicationType: string;

    @ForeignKey(() => PetType)
    @Column({
        type: DataType.STRING(36),
        allowNull: false,
        field: 'PET_TYPE_ID',
    })
    petTypeId: string;

    @BelongsTo(() => PetType)
    petType: PetType;

    @ForeignKey(() => Category)
    @Column({
        type: DataType.STRING(36),
        allowNull: false,
        field: 'CATEGORY_ID',
    })
    categoryId: string;

    @BelongsTo(() => Category)
    category: Category;

    @ForeignKey(() => Subcategory)
    @Column({
        type: DataType.STRING(36),
        allowNull: false,
        field: 'SUBCATEGORY_ID',
    })
    subcategoryId: string;

    @BelongsTo(() => Subcategory)
    subcategory: Subcategory;

    @ForeignKey(() => Size)
    @Column({
        type: DataType.STRING(5),
        allowNull: true,
        field: 'SIZE_ID',
    })
    sizeId?: string;

    @BelongsTo(() => Size)
    size?: Size;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
        field: 'WEIGHT',
    })
    weight?: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        field: 'FINAL_PRICE',
    })
    finalPrice: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'STOCK',
    })
    stock: number;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        field: 'DESCRIPTION',
    })
    description: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        field: 'MULTIMEDIA_FILES',
    })
    multimediaFiles: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'CREATED_AT',
        defaultValue: DataType.NOW,
    })
    createdAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'UPDATED_AT',
    })
    updatedAt?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'DELETED_AT',
    })
    deletedAt?: Date;
}
