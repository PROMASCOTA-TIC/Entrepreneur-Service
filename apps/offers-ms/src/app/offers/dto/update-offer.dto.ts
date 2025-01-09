import { IsOptional, IsDateString, IsNumber, Min, IsUUID } from 'class-validator';


export class UpdateOfferDto {
  
  @IsUUID('4', { message: 'El ID del emprendedor debe ser un UUID válido.' })
  @IsOptional()
  entrepreneurId: string;

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
