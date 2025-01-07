import { Type } from "class-transformer";
import { IsUUID, IsString, IsNumber, Min, IsOptional, IsIn } from "class-validator";

export class CreateProductDto {

  @IsUUID('4', { message: 'El ID del emprendedor debe ser un UUID válido.' })
  entrepreneurId: string;

  @IsString()
  @IsIn(['0', '1'], { message: 'El tipo de publicación debe ser "0" (servicio) o "1" (producto).' })
  publicationType: string;

  @IsString()
  petTypeId: string;

  @IsString()
  categoryId: string;

  @IsString()
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

  @IsString({ message: 'El nombre del producto debe ser una cadena válida.' })
  name: string; 

  @IsString()
  description: string;

  @IsString()
  multimediaFiles: string;
}
