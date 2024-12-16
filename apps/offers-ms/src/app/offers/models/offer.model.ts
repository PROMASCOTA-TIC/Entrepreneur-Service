import { Model, Column, Table, DataType } from 'sequelize-typescript';

@Table({ tableName: 'OFFERS', timestamps: false })
export class Offer extends Model {
  @Column({
    type: DataType.STRING(36),
    primaryKey: true,
    allowNull: false,
    field: 'ID',
  })
  id: string;

  @Column({
    type: DataType.STRING(36),
    allowNull: false,
    field: 'PRODUCT_ID',
  })
  productId: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    field: 'ORIGINAL_PRICE',
  })
  originalPrice: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    field: 'DISCOUNTED_PRICE',
  })
  discountedPrice: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    field: 'DISCOUNT_PERCENTAGE',
  })
  discountPercentage: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'START_DATE',
  })
  startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'END_DATE',
  })
  endDate: Date;

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
