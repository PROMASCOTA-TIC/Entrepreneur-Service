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
    this.logger.log('Initializing OffersService...');
    try {
      await this.offerModel.sequelize.authenticate();
      this.logger.log('Database connection established successfully.');
    } catch (error) {
      this.logger.error('Database connection failed:', error.message);
    }
  }

  /**
   * Crea una nueva oferta.
   */
  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const { productId, startDate, endDate, discountPercentage } = createOfferDto;

    const now = new Date();
    if (new Date(startDate) <= now) {
      throw new BadRequestException(
        'La fecha de inicio debe ser posterior al día actual.',
      );
    }
    if (new Date(endDate) <= new Date(startDate)) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    this.logger.log(`Fetching product with ID ${productId}...`);
    const product = await firstValueFrom(
      this.client.send('get_product_by_id', { id: productId }),
    );

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado.`);
    }

    const activeOffer = await this.offerModel.findOne({
      where: {
        productId,
        deletedAt: null,
      },
    });
    if (activeOffer) {
      throw new BadRequestException('El producto ya tiene una oferta activa.');
    }

    const originalPrice = product.finalPrice;
    const discountedPrice = parseFloat(
      (originalPrice * (1 - discountPercentage / 100)).toFixed(2),
    );

    this.logger.log(`Creating offer for product ID ${productId}...`);
    const offer = await this.offerModel.create({
      id: crypto.randomUUID(),
      productId,
      originalPrice,
      discountedPrice,
      discountPercentage, // Guardando el porcentaje de descuento
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    this.logger.log(`Offer scheduled: ${offer.id}`);
    return offer;
  }

  /**
   * Obtiene todas las ofertas (excluye las eliminadas).
   */
  async findAll(): Promise<Offer[]> {
    try {
      this.logger.log('Fetching all offers...');
      const offers = await this.offerModel.findAll({
        where: {
          deletedAt: null, // Filtra las ofertas no eliminadas
        },
      });
      this.logger.log(`Retrieved ${offers.length} offers.`);
      return offers;
    } catch (error) {
      this.logger.error('Error fetching offers:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene una oferta por su ID.
   */
  async findOne(id: string): Promise<Offer> {
    try {
      this.logger.log(`Fetching offer with ID ${id}...`);
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
    } catch (error) {
      this.logger.error(`Error fetching offer with ID ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Actualiza una oferta existente.
   */
  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    const { startDate, endDate, discountPercentage } = updateOfferDto;

    const offer = await this.findOne(id);

    if (startDate && new Date(startDate) <= new Date()) {
      throw new BadRequestException(
        'La fecha de inicio debe ser posterior al día actual.',
      );
    }
    if (endDate && new Date(endDate) <= new Date(startDate || offer.startDate)) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    if (discountPercentage) {
      const product = await firstValueFrom(
        this.client.send('get_product_by_id', { id: offer.productId }),
      );

      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${offer.productId} no encontrado.`,
        );
      }

      offer.discountedPrice = parseFloat(
        (product.finalPrice * (1 - discountPercentage / 100)).toFixed(2),
      );
      offer.discountPercentage = discountPercentage; // Actualizando el porcentaje de descuento
    }

    const updatedOffer = await offer.update({
      startDate: startDate ? new Date(startDate) : offer.startDate,
      endDate: endDate ? new Date(endDate) : offer.endDate,
      discountedPrice: offer.discountedPrice,
      discountPercentage: offer.discountPercentage,
      updatedAt: new Date(),
    });

    this.logger.log(`Offer ID ${id} updated successfully.`);
    return updatedOffer;
  }

  /**
   * Elimina una oferta por su ID (borrado lógico).
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    const offer = await this.findOne(id); // Verifica que la oferta existe
    await offer.update({ deletedAt: new Date() }); // Realiza el borrado lógico
    this.logger.log(`Offer with ID ${id} deleted successfully.`);

    // Devuelve una respuesta explícita
    return { message: 'Oferta eliminada correctamente.', id };
  }

  /**
   * Activa ofertas cuyo inicio coincide con la fecha actual.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async activateOffers(): Promise<void> {
    this.logger.log('Running Cron Job to activate offers...');
    const today = this.getEcuadorMidnight();

    const offersToActivate = await this.offerModel.findAll({
      where: {
        startDate: { [Op.eq]: today },
        deletedAt: null,
      },
    });

    for (const offer of offersToActivate) {
      try {
        this.logger.log(`Activating offer ID ${offer.id}...`);
        await firstValueFrom(
          this.client.send('update_product_price', {
            id: offer.productId,
            price: offer.discountedPrice,
          }),
        );
        this.logger.log(`Offer ID ${offer.id} activated.`);
      } catch (error) {
        this.logger.error(`Error activating offer ID ${offer.id}:`, error.message);
      }
    }
  }

  /**
   * Finaliza ofertas cuya fecha de fin coincide con la fecha actual.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async finalizeOffers(): Promise<void> {
    this.logger.log('Running Cron Job to finalize offers...');
    const today = this.getEcuadorMidnight();

    const offersToFinalize = await this.offerModel.findAll({
      where: {
        endDate: { [Op.eq]: today },
        deletedAt: null,
      },
    });

    for (const offer of offersToFinalize) {
      try {
        this.logger.log(`Finalizing offer ID ${offer.id}...`);
        await firstValueFrom(
          this.client.send('update_product_price', {
            id: offer.productId,
            price: offer.originalPrice,
          }),
        );
        await offer.update({ deletedAt: new Date() });
        this.logger.log(`Offer ID ${offer.id} finalized.`);
      } catch (error) {
        this.logger.error(`Error finalizing offer ID ${offer.id}:`, error.message);
      }
    }
  }

  /**
   * Obtiene la medianoche actual ajustada a la hora de Ecuador (UTC-5).
   */
  private getEcuadorMidnight(): Date {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0); // Configura a medianoche UTC
    now.setHours(now.getHours() - 5); // Ajusta a UTC-5 (Ecuador)
    return now;
  }
}
