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
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Endpoint para crear un nuevo producto (HTTP).
   * @param createProductDto - Datos para crear el producto.
   * @returns El producto creado.
   */
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    console.log('Solicitud recibida en POST /products:', createProductDto); 
    try {
      const product = await this.productsService.create(createProductDto);
      console.log('Producto creado:', product); 
      return product;
    } catch (error) {
      console.error('Error al crear el producto:', error.message); 
      throw new HttpException(
        'Error creating product: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Listener para crear un producto a través de NATS.
   * @param createProductDto - Datos del producto desde el mensaje NATS.
   * @returns El producto creado.
   */
  @MessagePattern('create_product')
  async createViaMessage(@Payload() createProductDto: CreateProductDto) {
    console.log('Mensaje recibido en create_product:', createProductDto); // Log para depuración
    try {
      const product = await this.productsService.create(createProductDto);
      console.log('Producto creado vía NATS:', product);
      return product;
    } catch (error) {
      console.error('Error al crear producto vía NATS:', error.message);
      throw new Error('Error creating product via NATS: ' + error.message);
    }
  }

  /**
   * Endpoint para obtener todos los productos (HTTP).
   * @returns Lista de productos.
   */
  @Get()
  async findAll() {
    try {
      console.log('Getting all products');
      return await this.productsService.findAll();
    } catch (error) {
      throw new HttpException(
        'Error retrieving products: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Listener para obtener todos los productos a través de NATS.
   * @returns Lista de productos.
   */
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

  /**
   * Endpoint para obtener un producto por ID (HTTP).
   * @param id - ID del producto.
   * @returns El producto encontrado.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.productsService.findOne(id);
    } catch (error) {
      throw new HttpException(
        'Error retrieving product: ' + error.message,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Listener para obtener un producto por ID a través de NATS.
   * @param id - ID del producto desde el mensaje NATS.
   * @returns El producto encontrado.
   */
  @MessagePattern('get_product_by_id')
  async findOneViaMessage(@Payload() payload: string | { id: string }) {
    let id: string;
  
    // Verificar si el payload es un string o un objeto
    if (typeof payload === 'string') {
      id = payload; // Payload como string
    } else if (payload && payload.id) {
      id = payload.id; // Payload como objeto
    } else {
      console.error('Payload inválido en get_product_by_id:', payload);
      throw new BadRequestException('El payload debe contener un campo "id" o ser un string.');
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
  

  /**
   * Endpoint para actualizar un producto por ID (HTTP).
   * @param id - ID del producto.
   * @param updateProductDto - Datos para actualizar el producto.
   * @returns El producto actualizado.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      return await this.productsService.update(id, updateProductDto);
    } catch (error) {
      throw new HttpException(
        'Error updating product: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Listener para actualizar un producto por ID a través de NATS.
   * @param payload - Contiene el ID y los datos de actualización.
   * @returns El producto actualizado.
   */
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

/* 
update precios para utilizar en el micro de ofertas
*/
@MessagePattern('update_product_price')
async updateProductPrice(@Payload() data: { id: string; price: number }) {
  const { id, price } = data;

  const product = await this.productsService.findOne(id);
  if (!product) {
    throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
  }

  await product.update({ finalPrice: price });
  return { message: 'Precio actualizado correctamente.' };
}


  /**
   * Endpoint para eliminar un producto por ID (HTTP).
   * @param id - ID del producto.
   * @returns Una confirmación de eliminación.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.productsService.remove(id);
      return { message: `Product with ID ${id} has been deleted.` };
    } catch (error) {
      throw new HttpException(
        'Error deleting product: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Listener para eliminar un producto por ID a través de NATS.
   * @param id - ID del producto desde el mensaje NATS.
   * @returns Una confirmación de eliminación.
   */
  @MessagePattern('delete_product')
  async removeViaMessage(@Payload() id: string) {
    console.log('Mensaje recibido en delete_product:', id);
    try {
      await this.productsService.remove(id);
      return { message: `Product with ID ${id} has been deleted.` };
    } catch (error) {
      console.error('Error al eliminar producto vía NATS:', error.message);
      throw new Error('Error deleting product via NATS: ' + error.message);
    }
  }
}
