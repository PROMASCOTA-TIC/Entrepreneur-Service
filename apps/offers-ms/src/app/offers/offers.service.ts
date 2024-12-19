import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cron } from '@nestjs/schedule';
import { CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { Offer } from './models/offer.model';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Op } from 'sequelize';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class OffersService implements OnModuleInit {
  private readonly logger = new Logger('OffersService');

  constructor(
    @InjectModel(Offer) private readonly offerModel: typeof Offer,
    @Inject('PRODUCTS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Connecting to the database...');
      await this.offerModel.sequelize.authenticate();
      this.logger.log('Database connected successfully.');
    } catch (error) {
      this.logger.error('Failed to connect to the database:', error.message);
      throw error;
    }
  }

  /**
 * Crea una nueva oferta.
 */
  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    this.logger.log(`Creating offer with productId: ${createOfferDto.productId}`);
    const { productId, startDate, endDate, discountPercentage } = createOfferDto;
  
    const now = new Date().toISOString();
  
    // Validar que la fecha de inicio sea posterior a la actual
    if (startDate <= now) {
      this.logger.error('Start date is in the past.');
      throw new BadRequestException(
        'La fecha de inicio debe ser posterior al día actual.',
      );
    }
  
    // Validar que la fecha de fin sea posterior a la fecha de inicio
    if (endDate <= startDate) {
      this.logger.error('End date is earlier than start date.');
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }
  
    // Verificar si ya existe una oferta que se solape con las fechas dadas
    this.logger.log('Checking for overlapping offers...');
    const overlappingOffer = await this.offerModel.findOne({
      where: {
        productId,
        deletedAt: null,
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] },
          },
          {
            endDate: { [Op.between]: [startDate, endDate] },
          },
          {
            startDate: { [Op.lte]: startDate },
            endDate: { [Op.gte]: endDate },
          },
        ],
      },
    });
  
    if (overlappingOffer) {
      this.logger.error(
        `Overlapping offer detected with ID: ${overlappingOffer.id}`,
      );
      throw new BadRequestException(
        'Ya existe una oferta para este producto en el rango de fechas proporcionado.',
      );
    }
  
    this.logger.log('Fetching product details...');
    const product = await firstValueFrom(
      this.client.send('get_product_by_id', { id: productId }),
    );
  
    if (!product) {
      this.logger.error(`Product with ID ${productId} not found.`);
      throw new NotFoundException(`Producto con ID ${productId} no encontrado.`);
    }
  
    const originalPrice = product.finalPrice;
    const discountedPrice = parseFloat(
      (originalPrice * (1 - discountPercentage / 100)).toFixed(2),
    );
  
    // Insertar la oferta en la base de datos
    this.logger.log('Inserting offer into database...');
    const offer = await this.offerModel.create({
      id: crypto.randomUUID(),
      productId,
      productName: product.name, // Asegúrate de que el nombre del producto se incluya
      originalPrice,
      discountedPrice,
      discountPercentage,
      startDate,
      endDate,
    });
    this.logger.log(`Offer created with ID: ${offer.id}`);
    return offer; 
  }
  
  /**
   * Activa ofertas cuyo inicio coincide con la fecha actual.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  
  async activateOffers(): Promise<{ message: string; activatedOffers?: Offer[] }> {
    const now = new Date().toISOString(); // Hora actual en formato UTC
    this.logger.log(`Cron job started for activating offers. Current time (UTC): ${now}`);
  
    // Consulta las ofertas que cumplen la condición
    const offersToActivate = await this.offerModel.findAll({
      where: {
        startDate: { [Op.lte]: now }, // Fecha de inicio menor o igual a la actual
        deletedAt: null, 
      },
    });
  
    if (offersToActivate.length === 0) {
      this.logger.log('No offers found to activate at this time.');
      return { message: 'No hay ofertas para activar en este momento.' };
    }
  
    this.logger.log(`Found ${offersToActivate.length} offer(s) to activate.`);
  
    const activatedOffers = [];
    for (const offer of offersToActivate) {
      try {
        this.logger.log(`Processing offer ID: ${offer.id}`);
        this.logger.log(
          `Offer details: Start Date = ${offer.startDate}, Discount Price = ${offer.discountedPrice}`,
        );
  
        await firstValueFrom(
          this.client.send('update_product_price', {
            id: offer.productId,
            price: offer.discountedPrice,
          }),
        );
  
        this.logger.log(`Offer ID: ${offer.id} activated successfully.`);
        activatedOffers.push(offer);
      } catch (error) {
        this.logger.error(
          `Error activating offer ID: ${offer.id}. Error: ${error.message}`,
        );
      }
    }
  
    this.logger.log(
      `Activation process completed. Total activated offers: ${activatedOffers.length}`,
    );
  
    return { message: 'Ofertas activadas correctamente.', activatedOffers };
  }
  
  /**
   * Finaliza ofertas cuya fecha de fin coincide con la fecha actual.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async finalizeOffers(): Promise<{ message: string; finalizedOffers?: Offer[] }> {
    const now = new Date().toISOString(); // Generar la hora actual en formato ISO 8601 (UTC)
  
    this.logger.log(`Checking for offers to finalize at: ${now}`);
  
    // Consultar las ofertas que cumplen la condición de finalización
    const offersToFinalize = await this.offerModel.findAll({
      where: {
        endDate: { [Op.lte]: now }, 
        deletedAt: null,
      },
    });
  
    if (offersToFinalize.length === 0) {
      this.logger.log('No offers found to finalize.');
      return { message: 'No hay ofertas para finalizar en este momento.' };
    }
  
    this.logger.log(`Found ${offersToFinalize.length} offer(s) to finalize.`);
  
    const finalizedOffers = [];
    for (const offer of offersToFinalize) {
      try {
        this.logger.log(`Finalizing offer ID ${offer.id}, End Date: ${offer.endDate}...`);
  
        // Actualizar el precio original en el producto
        await firstValueFrom(
          this.client.send('update_product_price', {
            id: offer.productId,
            price: offer.originalPrice,
          }),
        );
  
        // Actualizar la oferta como finalizada (borrado lógico)
        await offer.update({ deletedAt: new Date().toISOString() });
  
        finalizedOffers.push(offer);
        this.logger.log(`Offer ID ${offer.id} finalized successfully.`);
      } catch (error) {
        this.logger.error(`Error finalizing offer ID ${offer.id}: ${error.message}`);
      }
    }
  
    return { message: 'Ofertas finalizadas correctamente.', finalizedOffers };
  }
  
  /**
 * Obtiene todas las ofertas (excluye las eliminadas).
 */
async findAll(): Promise<Offer[]> {
  this.logger.log('Fetching all offers...');
  const offers = await this.offerModel.findAll({
    where: {
      deletedAt: null, // Excluye las ofertas eliminadas
    },
  });

  if (offers.length === 0) {
    this.logger.log('No offers found.');
  } else {
    this.logger.log(`Found ${offers.length} offer(s).`);
  }

  return offers;
}

  /**
 * Obtiene una oferta por su ID.
 * @param id - ID de la oferta.
 */
async findOne(id: string): Promise<Offer> {
  const offer = await this.offerModel.findOne({
    where: {
      id,
      deletedAt: null, // Excluye las ofertas eliminadas
    },
  });

  if (!offer) {
    throw new NotFoundException(`Oferta con ID ${id} no encontrada.`);
  }

  return offer;
}

/**
 * Actualiza una oferta existente.
 * @param id - ID de la oferta.
 * @param updateOfferDto - DTO con los datos para actualizar la oferta.
 */
async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
  const offer = await this.findOne(id);

  const { startDate, endDate, discountPercentage } = updateOfferDto;

  if (startDate && startDate <= new Date().toISOString()) {
    throw new BadRequestException(
      'La fecha de inicio debe ser posterior al día actual.',
    );
  }

  if (endDate && endDate <= (startDate || offer.startDate)) {
    throw new BadRequestException(
      'La fecha de fin debe ser posterior a la fecha de inicio.',
    );
  }

  if (discountPercentage) {
    const product = await firstValueFrom(
      this.client.send('get_product_by_id', { id: offer.productId }),
    );

    if (!product) {
      throw new NotFoundException(`Producto con ID ${offer.productId} no encontrado.`);
    }

    offer.discountedPrice = parseFloat(
      (product.finalPrice * (1 - discountPercentage / 100)).toFixed(2),
    );
    offer.discountPercentage = discountPercentage;
  }

  const updatedOffer = await offer.update({
    startDate: startDate || offer.startDate,
    endDate: endDate || offer.endDate,
    discountedPrice: offer.discountedPrice,
    discountPercentage: offer.discountPercentage,
    updatedAt: new Date().toISOString(),
  });

  return updatedOffer;
}

/**
 * Elimina una oferta por su ID (borrado lógico).
 * @param id - ID de la oferta.
 */
async remove(id: string): Promise<{ message: string; id: string }> {
  const offer = await this.findOne(id);

  await offer.update({ deletedAt: new Date().toISOString() });

  return { message: 'Oferta eliminada correctamente.', id };
}

}

