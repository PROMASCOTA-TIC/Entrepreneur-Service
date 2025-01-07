import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  private readonly logger = new Logger(ProductsController.name);

 //Endpoint para crear productos.
  @MessagePattern('create_product')
  async createViaMessage(@Payload() createProductDto: CreateProductDto) {
    console.log('Mensaje recibido en create_product:', createProductDto);
    try {
      const product = await this.productsService.create(createProductDto);
      console.log('Producto creado vía NATS:', product);
      return product;
    } catch (error) {
      console.error('Error al crear producto vía NATS:', error.message);
      throw new Error('Error creating product via NATS: ' + error.message);
    }
  }

// Endpoint para obtener todos los productos.

  @MessagePattern('get_all_products')
  async findAllViaMessage() {
    console.log('Mensaje recibido en get_all_products');
    try {
      return await this.productsService.findAll();
    } catch (error) {
      console.error('Error al obtener productos vía NATS:', error.message);
      throw new Error('Error retrieving products via NATS: ' + error.message);
    }
  }


// Endpoint para obtener un producto por ID.

  @MessagePattern('get_product_by_id')
  async findOneViaMessage(@Payload() payload: string | { id: string }) {
    let id: string;

    if (typeof payload === 'string') {
      id = payload; 
    } else if (payload && payload.id) {
      id = payload.id; 
    } else {
      console.error('Payload inválido en get_product_by_id:', payload);
      throw new BadRequestException(
        'El payload debe contener un campo "id" o ser un string.',
      );
    }

    console.log('Mensaje recibido en get_product_by_id con ID:', id);

    try {
      const product = await this.productsService.findOne(id);
      if (!product) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
      }
      return product;
    } catch (error) {
      console.error(`Error al obtener producto con ID ${id}:`, error.message);
      throw new BadRequestException(`Error fetching product: ${error.message}`);
    }
  }


// Endpoint para actualizar un producto por ID.
  @MessagePattern('update_product')
  async updateViaMessage(@Payload() payload: { id: string; dto: UpdateProductDto }) {
    const { id, dto } = payload;
    console.log('Mensaje recibido en update_product:', payload);
    try {
      return await this.productsService.update(id, dto);
    } catch (error) {
      console.error('Error al actualizar producto vía NATS:', error.message);
      throw new Error('Error updating product via NATS: ' + error.message);
    }
  }

// Endpoint para eliminar un producto por ID.

  @MessagePattern('delete_product')
  async removeViaMessage(@Payload() payload: string | { id: string }) {
    let id: string;
      if (typeof payload === 'string') {
      id = payload; 
    } else if (payload && payload.id) {
      id = payload.id; 
    } else {
      console.error('Payload inválido en delete_product:', payload);
      throw new BadRequestException('El payload debe contener un campo "id" o ser un string.');
    }
    console.log('Mensaje recibido en delete_product con ID:', id);
    try {
      await this.productsService.remove(id);
      return { message: `Producto con ID ${id} eliminado correctamente.` };
    } catch (error) {
      console.error('Error al eliminar producto vía NATS:', error.message);
      throw new Error('Error deleting product via NATS: ' + error.message);
    }
  }
  
  // Endpoint para actualizar el precio de un producto por ID.
  @MessagePattern('update_product_price')
async updateProductPrice(@Payload() data: { id: string; price: number }) {
  const { id, price } = data;

  const product = await this.productsService.findOne(id);
  if (!product) {
    throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
  }

  await product.update({ finalPrice: price });
  this.logger.log(`Updating product price for ID: ${id}, new price: ${price}`);
  return { message: 'Precio actualizado correctamente.' };
}

// Endpoint para obtener productos por ID de emprendedor.
@MessagePattern('get_products_by_entrepreneur')
async findAllByEntrepreneur(@Payload() entrepreneurId: string) {
  this.logger.log(`Mensaje recibido para obtener productos del emprendedor con ID: ${entrepreneurId}`);
  try {
    return await this.productsService.findAllByEntrepreneur(entrepreneurId);
  } catch (error) {
    this.logger.error(`Error al obtener productos del emprendedor con ID ${entrepreneurId}: ${error.message}`);
    throw new HttpException(
      `Error al obtener productos: ${error.message}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}



}
