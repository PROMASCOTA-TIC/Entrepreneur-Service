import { Model, Column, Table, DataType, HasMany } from "sequelize-typescript";
import { Product } from "./products.models";


@Table({ tableName: 'PET_TYPES', timestamps: false })
export class PetType extends Model {
    @Column({
        type: DataType.STRING(36),
        primaryKey: true,
        allowNull: false,
        field: 'ID',
    })
    id: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        field: 'NAME',
    })
    name: string;

    @HasMany(() => Product)
    products: Product[];
}
