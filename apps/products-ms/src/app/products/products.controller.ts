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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Endpoint para crear un nuevo producto.
   * @param createProductDto - Datos para crear el producto.
   * @returns El producto creado.
   */
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    console.log('Solicitud recibida en POST /products:', createProductDto); // Log para depuración
    try {
      const product = await this.productsService.create(createProductDto);
      console.log('Producto creado:', product); // Log del producto creado
      return product;
    } catch (error) {
      console.error('Error al crear el producto:', error.message); // Log del error
      throw new HttpException(
        'Error creating product: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  
  

  /**
   * Endpoint para obtener todos los productos.
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
   * Endpoint para obtener un producto por ID.
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
   * Endpoint para actualizar un producto por ID.
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
   * Endpoint para eliminar un producto por ID.
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
}