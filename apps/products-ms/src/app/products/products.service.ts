import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Product } from './models/products.models';
import { InjectModel } from '@nestjs/sequelize';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';



@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    @Inject('USER_SERVICE') private readonly  client: ClientProxy,
  ) {}
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
  async validateEntrepreneur(entrepreneurId: string): Promise<void> {
    try {
      this.logger.log(`Validando emprendedor con ID: ${entrepreneurId} usando NATS vía API Gateway`);
  
      const entrepreneur = await lastValueFrom(
        this.client.send({ cmd: 'get_entrepreneur_by_id' }, entrepreneurId),
      );
  
      if (!entrepreneur) {
        throw new Error(`El emprendedor con ID ${entrepreneurId} no existe.`);
      }
  
      this.logger.log(`Emprendedor validado correctamente con ID: ${entrepreneurId}`);
    } catch (error) {
      this.logger.error(`Error validando emprendedor con ID ${entrepreneurId}: ${error.message}`);
      throw new BadRequestException(`Error validando emprendedor: ${error.message}`);
    }
  }
  
  
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      await this.validateEntrepreneur(createProductDto.entrepreneurId);
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

  async findAll(): Promise<Product[]> {
    try {
      const products = await this.productModel.findAll({
        where: {
          deletedAt: null,
        },
        attributes: ['id', 'entrepreneurId','name', 'finalPrice', 'description', 'stock'], 
        include: { all: true }, 
      });

      this.logger.log(`Retrieved ${products.length} products.`);
      return products;
    } catch (error) {
      this.logger.error('Error retrieving products:', error.message);
      throw error;
    }
  }


  async findAllByEntrepreneur(entrepreneurId: string): Promise<Product[]> {
    try {
      await this.validateEntrepreneur(entrepreneurId);
      const products = await this.productModel.findAll({
        where: {
          entrepreneurId,
          deletedAt: null, 
        },
      });
  
      if (products.length === 0) {
        this.logger.warn(`No se encontraron productos para el emprendedor con ID ${entrepreneurId}`);
      } else {
        this.logger.log(`Se encontraron ${products.length} productos para el emprendedor con ID ${entrepreneurId}`);
      }
  
      return products;
    } catch (error) {
      this.logger.error(`Error al obtener productos para el emprendedor con ID ${entrepreneurId}:`, error.message);
      throw new BadRequestException(`Error al obtener productos: ${error.message}`);
    }
  }
  

  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.productModel.findByPk(id, {
        attributes: ['id','entrepreneurId', 'name', 'finalPrice', 'description', 'stock'], 
        include: { all: true },
      });

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

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.findOne(id);

      await product.update({
        ...updateProductDto,
        updatedAt: new Date(),
      });

      this.logger.log(`Product updated: ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`Error updating product with ID ${id}:`, error.message);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const product = await this.findOne(id);
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
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
