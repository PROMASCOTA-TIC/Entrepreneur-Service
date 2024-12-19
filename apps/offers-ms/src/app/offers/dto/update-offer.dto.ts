import { IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class UpdateOfferDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida en formato ISO 8601.' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida en formato ISO 8601.' })
  endDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje de descuento debe ser un número válido.' })
  @Min(0, { message: 'El descuento no puede ser negativo.' })
  discountPercentage?: number;
}
