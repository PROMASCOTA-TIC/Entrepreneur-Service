import { HttpException, HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Product } from './models/products.models';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product)
    private productModel: typeof Product,
  ) { }
  private readonly logger = new Logger('ProductsService');

  async onModuleInit() {
    this.logger.log('Initializing database connection...');
    try {
      await this.productModel.sequelize.authenticate();
      this.logger.log('Connection to the database has been established successfully.');
    } catch (error) {
      this.logger.error('Unable to connect to the database:', error.message);
    }
  }
 
  /**
   * Crea un nuevo producto.
   * @param createProductDto - Datos para crear el producto.
   * @returns El producto creado.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Convertimos el DTO explícitamente al objeto compatible con el modelo
      const product = await this.productModel.create({
        ...createProductDto,
      });

      this.logger.log(`Product created: ${product.id}`);
      return product;
    } catch (error) {
      this.logger.error('Error creating product:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene todos los productos.
   * @returns Una lista de productos.
   */
  async findAll(): Promise<Product[]> {
    try {
      const products = await this.productModel.findAll({
        where: {
          deletedAt: null, 
        },
        include: { all: true }, 
      });
      
      this.logger.log(`Retrieved ${products.length} products.`);
      return products;
    } catch (error) {
      this.logger.error('Error retrieving products:', error.message);
      throw error;
    }
  }
  

  /**
   * Obtiene un producto por su ID.
   * @param id - ID del producto.
   * @returns El producto encontrado.
   * @throws NotFoundException si el producto no existe.
   */
  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.productModel.findByPk(id, { include: { all: true } });
      if (!product) {
        this.logger.warn(`Product not found: ${id}`);
        throw new NotFoundException(`Product with ID ${id} not found.`);
      }
      return product;
    } catch (error) {
      this.logger.error(`Error finding product with ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Actualiza un producto por su ID.
   * @param id - ID del producto.
   * @param updateProductDto - Datos para actualizar el producto.
   * @returns El producto actualizado.
   * @throws NotFoundException si el producto no existe.
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.findOne(id);
      await product.update({ ...updateProductDto });
      this.logger.log(`Product updated: ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`Error updating product with ID ${id}:`, error.message);
      throw error;
    }
  }

/**
 * Elimina un producto por su ID de forma lógica (soft delete).
 * @param id - ID del producto.
 * @returns Una confirmación de eliminación.
 * @throws NotFoundException si el producto no existe.
 */
async remove(id: string): Promise<void> {
  try {
    const product = await this.findOne(id); // Buscar el producto por ID
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    // Realizar un soft delete actualizando la columna deletedAt
    await product.update({ deletedAt: new Date() });
    this.logger.log(`Product logically deleted: ${id}`);
  } catch (error) {
    this.logger.error(`Error deleting product with ID ${id}:`, error.message);
    throw new HttpException(
      `Error deleting product: ${error.message}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

}