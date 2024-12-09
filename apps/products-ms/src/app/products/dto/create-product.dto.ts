import { Type } from "class-transformer";
import { IsUUID, IsString, IsNumber, Min, IsOptional, IsIn } from "class-validator";

export class CreateProductDto {
  @IsUUID('4', { message: 'El ID debe ser un UUID válido.' })
  id: string;

  @IsString()
  @IsIn(['0', '1'], { message: 'El tipo de publicación debe ser "0" (servicio) o "1" (producto).' })
  publicationType: string;

  @IsUUID('4', { message: 'El ID de tipo de mascota debe ser un UUID válido.' })
  petTypeId: string;

  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido.' })
  categoryId: string;

  @IsUUID('4', { message: 'El ID de subcategoría debe ser un UUID válido.' })
  subcategoryId: string;

  @IsString({ message: 'El ID de tamaño debe ser una cadena válida.' })
  @IsOptional()
  sizeId?: string;

  @IsNumber({}, { message: 'El peso debe ser un número válido.' })
  @Min(0, { message: 'El peso no puede ser negativo.' })
  @Type(() => Number)
  @IsOptional()
  weight?: number;

  @IsNumber({}, { message: 'El precio debe ser un número válido.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  @Type(() => Number)
  finalPrice: number;

  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  @Type(() => Number)
  stock: number;

  @IsString()
  description: string;

  @IsString()
  multimediaFiles: string;
}
