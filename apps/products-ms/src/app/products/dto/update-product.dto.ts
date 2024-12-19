import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsNumber, Min, IsUUID, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsUUID('4', { message: 'El ID debe ser un UUID válido.' })
  @IsOptional()
  id?: string;

  @IsString()
  @IsIn(['0', '1'], { message: 'El tipo de publicación debe ser "0" (servicio) o "1" (producto).' })
  @IsOptional()
  publicationType?: string;

  @IsUUID('4', { message: 'El ID de tipo de mascota debe ser un UUID válido.' })
  @IsOptional()
  petTypeId?: string;

  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido.' })
  @IsOptional()
  categoryId?: string;

  @IsUUID('4', { message: 'El ID de subcategoría debe ser un UUID válido.' })
  @IsOptional()
  subcategoryId?: string;

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
  @IsOptional()
  finalPrice?: number;

  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  @Type(() => Number)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  multimediaFiles?: string;

  @IsString({ message: 'El nombre del producto debe ser una cadena válida.' })
  @IsOptional()
  name?: string; // Campo opcional para actualizar el nombre del producto
}
