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
import { PetType } from './models/pettype.models';
import { Category } from './models/category.models';
import { Subcategory } from './models/subcategory.models';
import { Size } from './models/size.models';
import { Op } from 'sequelize';


@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    @InjectModel(PetType)
    private readonly petTypeModel: typeof PetType,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Subcategory)
    private readonly subcategoryModel: typeof Subcategory,
    @InjectModel(Size)
    private readonly sizeModel: typeof Size,
    @Inject('USER_SERVICE') private readonly  client: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
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
      // Validar que el emprendedor exista
      await this.validateEntrepreneur(createProductDto.entrepreneurId);
  
      // Lógica para convertir el array multimediaFiles en una cadena separada por comas
      const multimediaFiles = Array.isArray(createProductDto.multimediaFiles)
        ? createProductDto.multimediaFiles.join(', ') // Unir URLs con comas
        : createProductDto.multimediaFiles;
  
      // Crear el producto con el campo multimediaFiles ajustado
      const product = await this.productModel.create({
        ...createProductDto,
        multimediaFiles, // Sobrescribir el campo con la lógica aplicada
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


  async findAllByEntrepreneur(entrepreneurId: string): Promise<any[]> {
    try {
      // Validar el ID del emprendedor
      await this.validateEntrepreneur(entrepreneurId);
  
      // Consultar los productos con las relaciones necesarias
      const products = await this.productModel.findAll({
        where: {
          entrepreneurId,
          deletedAt: null,
        },
        include: [
          {
            model: PetType,
            as: 'petType',
            attributes: ['name'], // Obtener solo el nombre
          },
          {
            model: Category,
            as: 'category',
            attributes: ['name'], // Obtener solo el nombre
          },
          {
            model: Subcategory,
            as: 'subcategory',
            attributes: ['name'], // Obtener solo el nombre
          },
          {
            model: Size,
            as: 'size',
            attributes: ['name'], // Obtener solo el nombre
          },
        ],
      });
  
      // Validar si hay productos
      if (products.length === 0) {
        this.logger.warn(`No se encontraron productos para el emprendedor con ID ${entrepreneurId}`);
      } else {
        this.logger.log(`Se encontraron ${products.length} productos para el emprendedor con ID ${entrepreneurId}`);
      }
  
      // Formatear los datos para devolver los nombres
      const formattedProducts = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        publicationType: product.publicationType === '1' ? 'Producto' : 'Servicio',
        petType: product.petType?.name || null,
        category: product.category?.name || null,
        subcategory: product.subcategory?.name || null,
        size: product.size?.name || null,
        weight: product.weight,
        finalPrice: product.finalPrice,
        stock: product.stock,
        multimediaFiles: product.multimediaFiles,
        createdAt: product.createdAt,
      }));
  
      return formattedProducts;
    } catch (error) {
      this.logger.error(`Error al obtener productos para el emprendedor con ID ${entrepreneurId}:`, error.message);
      throw new BadRequestException(`Error al obtener productos: ${error.message}`);
    }
  }

  async findLowStockProductsByEntrepreneur(entrepreneurId: string): Promise<any[]> {
    try {
      // Validar el ID del emprendedor
      await this.validateEntrepreneur(entrepreneurId);

      // Consultar los productos con stock menor a 3
      const products = await this.productModel.findAll({
        where: {
          entrepreneurId,
          stock: { [Op.lt]: 5 }, // Filtrar productos con stock menor a 3
          deletedAt: null,
        },
        include: [
          { model: PetType, as: 'petType', attributes: ['name'] },
          { model: Category, as: 'category', attributes: ['name'] },
          { model: Subcategory, as: 'subcategory', attributes: ['name'] },
          { model: Size, as: 'size', attributes: ['name'] },
        ],
      });

      // Validar si hay productos con stock bajo
      if (products.length === 0) {
        this.logger.warn(`No se encontraron productos con stock bajo para el emprendedor con ID ${entrepreneurId}`);
      } else {
        this.logger.log(`Se encontraron ${products.length} productos con stock bajo para el emprendedor con ID ${entrepreneurId}`);
      }

      // Formatear los datos para devolverlos de forma ordenada
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        publicationType: product.publicationType === '1' ? 'Producto' : 'Servicio',
        petType: product.petType?.name || null,
        category: product.category?.name || null,
        subcategory: product.subcategory?.name || null,
        size: product.size?.name || null,
        weight: product.weight,
        finalPrice: product.finalPrice,
        stock: product.stock,
        multimediaFiles: product.multimediaFiles,
        createdAt: product.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Error al obtener productos con stock bajo para el emprendedor con ID ${entrepreneurId}: ${error.message}`);
      throw new BadRequestException(`Error al obtener productos con stock bajo: ${error.message}`);
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
  
      // Convertir multimediaFiles a string si es un array
      const multimediaFiles =
        Array.isArray(updateProductDto.multimediaFiles) 
          ? updateProductDto.multimediaFiles.join(', ') 
          : updateProductDto.multimediaFiles;
  
      await product.update({
        ...updateProductDto,
        multimediaFiles, // Sobrescribir multimediaFiles con el formato correcto
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

  async findAllPetTypes(): Promise<PetType[]> {
    try {
        this.logger.log('Fetching all pet types from the database.');

        // Consulta específica solo de la tabla PET_TYPES sin incluir relaciones
        const petTypes = await this.petTypeModel.findAll({
            attributes: ['id', 'name'], // Selecciona solo columnas necesarias
            raw: true, // Evita relaciones y devuelve objetos planos
        });

        this.logger.log(`Retrieved ${petTypes.length} pet types.`);
        return petTypes;
    } catch (error) {
        this.logger.error('Error retrieving pet types:', error.message);
        throw new HttpException(
            `Error retrieving pet types: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

 async findAllCategories(): Promise<Category[]> {
    try {
        this.logger.log('Fetching all categories from the database.');

        // Consulta específica solo de la tabla CATEGORIES sin incluir relaciones
        const categories = await this.categoryModel.findAll({
            attributes: ['id', 'name'], // Selecciona solo columnas necesarias
            raw: true, // Evita relaciones y devuelve objetos planos
        });

        this.logger.log(`Retrieved ${categories.length} categories.`);
        return categories;
    } catch (error) {
        this.logger.error('Error retrieving categories:', error.message);
        throw new HttpException(
            `Error retrieving categories: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  async findAllSubcategories(): Promise<Subcategory[]> {
    try {
        this.logger.log('Fetching all subcategories from the database.');

        // Consulta específica solo de la tabla SUBCATEGORIES sin incluir relaciones
        const subcategories = await this.subcategoryModel.findAll({
            attributes: ['id', 'name', 'categoryId'], // Selecciona solo columnas necesarias
            raw: true, // Evita relaciones y devuelve objetos planos
        });

        this.logger.log(`Retrieved ${subcategories.length} subcategories.`);
        return subcategories;
    } catch (error) {
        this.logger.error('Error retrieving subcategories:', error.message);
        throw new HttpException(
            `Error retrieving subcategories: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  async findAllSizes(): Promise<Size[]> {
    try {
        this.logger.log('Fetching all sizes from the database.');

        // Consulta específica solo de la tabla SIZES sin incluir relaciones
        const sizes = await this.sizeModel.findAll({
            attributes: ['id', 'name', ], // Selecciona solo columnas necesarias
            raw: true, // Evita relaciones y devuelve objetos planos
        });

        this.logger.log(`Retrieved ${sizes.length} sizes.`);
        return sizes;
    } catch (error) {
        this.logger.error('Error retrieving sizes:', error.message);
        throw new HttpException(
            `Error retrieving sizes: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }


  async findProductForEdit(productId: string): Promise<any> {
    try {
      this.logger.log(`Fetching product details for editing with ID: ${productId}`);
  
      const product = await this.productModel.findByPk(productId, {
        include: [
          {
            model: PetType,
            as: 'petType',
            attributes: ['id', 'name'], // Incluir ID y nombre
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'], // Incluir ID y nombre
          },
          {
            model: Subcategory,
            as: 'subcategory',
            attributes: ['id', 'name'], // Incluir ID y nombre
          },
          {
            model: Size,
            as: 'size',
            attributes: ['id', 'name'], // Incluir ID y nombre
          },
        ],
      });
  
      if (!product) {
        this.logger.warn(`Product with ID ${productId} not found.`);
        throw new NotFoundException(`Producto con ID ${productId} no encontrado.`);
      }
  
      const formattedProduct = {
        id: product.id,
        entrepreneurId: product.entrepreneurId,
        publicationType: product.publicationType,
        petTypeId: product.petTypeId,
        petType: product.petType ? { id: product.petType.id, name: product.petType.name } : null,
        categoryId: product.categoryId,
        category: product.category ? { id: product.category.id, name: product.category.name } : null,
        subcategoryId: product.subcategoryId,
        subcategory: product.subcategory
          ? { id: product.subcategory.id, name: product.subcategory.name }
          : null,
        sizeId: product.sizeId,
        size: product.size ? { id: product.size.id, name: product.size.name } : null,
        name: product.name,
        description: product.description,
        finalPrice: product.finalPrice,
        stock: product.stock,
        weight: product.weight,
        multimediaFiles: product.multimediaFiles.split(',').map((url) => url.trim()), // Convertir string a array
        createdAt: product.createdAt,
      };
  
      this.logger.log(`Product details for editing fetched successfully: ${productId}`);
      return formattedProduct;
    } catch (error) {
      this.logger.error(
        `Error fetching product details for editing with ID ${productId}: ${error.message}`,
      );
      throw new HttpException(
        `Error al obtener los detalles del producto: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getOrdersTotalByEntrepreneur(entrepreneurId: string) {
    try {
      this.logger.log(`Fetching orders for entrepreneur ID: ${entrepreneurId}`);
  
      // Obtener las órdenes del microservicio de órdenes
      const orders = await lastValueFrom(
        this.orderClient.send('get_orders_by_entrepreneur', { entrepreneurId }),
      );
  
      if (!orders || orders.length === 0) {
        this.logger.warn(`No orders found for entrepreneur ID: ${entrepreneurId}`);
        return { entrepreneurId, totalOrders: 0, orders: [] };
      }
  
      // Obtener todos los IDs de productos en las órdenes
      const itemIds = orders.flatMap(order => order.orderItems.map(item => item.itemId));
  
      // Consultar la base de datos de productos para obtener los nombres
      const products = await this.productModel.findAll({
        where: { id: itemIds },
        attributes: ['id', 'name'],
      });
  
      // Crear un mapa de ID de producto -> Nombre
      const productNameMap = products.reduce((acc, product) => {
        acc[product.id] = product.name;
        return acc;
      }, {});
  
      // Procesar cada orden para calcular totales y obtener información del comprador
      const ordersWithDetails = await Promise.allSettled(
        orders.map(async (order) => {
          const total = order.orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
          const totalItems = order.orderItems.reduce((acc, item) => acc + item.quantity, 0);
  
          // Obtener información del comprador (cliente)
          let buyerInfo = null;
          try {
            buyerInfo = await lastValueFrom(this.client.send('find_pet_owner_by_id', order.userId));
          } catch (error) {
            this.logger.warn(`Buyer info not found for userId: ${order.userId}, skipping...`);
          }
  
          // Agregar el nombre del producto a cada `orderItem`
          const orderItemsWithNames = order.orderItems.map((item) => ({
            orderItemId: item.orderItemId,
            itemId: item.itemId,
            name: productNameMap[item.itemId] || 'Producto no encontrado', // Agregar el nombre del producto
            quantity: item.quantity,
            price: item.price,
            totalItems: item.quantity,
            status: item.status,
            entrepreneurId: item.entrepreneurId,
            orderId: item.orderId,
            createdAt: item.createdAt,
          }));
  
          return {
            id: order.id,
            userId: order.userId,
            status: order.status,
            isActive: order.isActive,
            isPaid: order.isPaid,
            paidAt: order.paidAt,
            homeDelivery: order.homeDelivery,
            petOwnerAddressId: order.petOwnerAddressId,
            petOwnerAddress: order.petOwnerAddress,
            petOwnerPhone: order.petOwnerPhone,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            canceledAt: order.canceledAt,
            total,
            totalItems,
            orderItems: orderItemsWithNames, // 🔥 Ahora cada `orderItem` incluye el nombre del producto
            buyer: buyerInfo
              ? {
                  id: buyerInfo.id,
                  name: buyerInfo.name,
                  email: buyerInfo.email,
                  phoneNumber: buyerInfo.phoneNumber,
                }
              : null,
          };
        }),
      );
  
      // Filtrar solo las órdenes que se resolvieron correctamente
      const successfulOrders = ordersWithDetails
        .filter((res) => res.status === 'fulfilled')
        .map((res) => res.value);
  
      return {
        entrepreneurId,
        totalOrders: successfulOrders.length,
        orders: successfulOrders,
      };
    } catch (error) {
      this.logger.error(`Error fetching orders for entrepreneur ID ${entrepreneurId}: ${error.message}`);
      throw new HttpException(`Error fetching orders: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  
  async findTopSellingProductsByEntrepreneur(entrepreneurId: string): Promise<any[]> {
    try {
      // Validar si el emprendedor existe
      await this.validateEntrepreneur(entrepreneurId);
  
      // Obtener los productos ordenados por cantidad vendida de mayor a menor
      const products = await this.productModel.findAll({
        where: {
          entrepreneurId,
          deletedAt: null,
        },
        order: [['soldQuantity', 'DESC']], // Ordenar por cantidad vendida descendente
        limit: 10, // Limitar a los 10 más vendidos
        include: [
          { model: PetType, as: 'petType', attributes: ['name'] },
          { model: Category, as: 'category', attributes: ['name'] },
          { model: Subcategory, as: 'subcategory', attributes: ['name'] },
          { model: Size, as: 'size', attributes: ['name'] },
        ],
      });
  
      // Verificar si hay productos
      if (products.length === 0) {
        this.logger.warn(`No se encontraron productos más vendidos para el emprendedor con ID ${entrepreneurId}`);
        return [];
      }
  
      this.logger.log(`Se encontraron los 10 productos más vendidos para el emprendedor con ID ${entrepreneurId}`);
  
      // Formatear la respuesta
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        publicationType: product.publicationType === '1' ? 'Producto' : 'Servicio',
        petType: product.petType?.name || null,
        category: product.category?.name || null,
        subcategory: product.subcategory?.name || null,
        size: product.size?.name || null,
        weight: product.weight,
        finalPrice: product.finalPrice,
        stock: product.stock,
        soldQuantity: product.soldQuantity, // Cantidad vendida
        multimediaFiles: product.multimediaFiles,
        createdAt: product.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Error al obtener los productos más vendidos para el emprendedor con ID ${entrepreneurId}: ${error.message}`);
      throw new HttpException(`Error al obtener productos más vendidos: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
}
