import { IsUUID, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateOfferDto {
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido.' })
  productId: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida en formato ISO 8601.' })
  startDate: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida en formato ISO 8601.' })
  endDate: string;

  @IsNumber({}, { message: 'El porcentaje de descuento debe ser un número válido.' })
  @Min(0, { message: 'El descuento no puede ser negativo.' })
  discountPercentage: number;
}
