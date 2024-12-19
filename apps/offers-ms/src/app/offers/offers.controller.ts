import { BadRequestException, Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Controller()
export class OffersController {
  private readonly logger = new Logger(OffersController.name);

  constructor(private readonly offersService: OffersService) {}

  /**
   * Crea una nueva oferta.
   * @param createOfferDto 
   */
  @MessagePattern('create_offer')
  async handleCreateOffer(@Payload() createOfferDto: CreateOfferDto) {
    this.logger.log(`Received create_offer pattern for productId: ${createOfferDto.productId}`);
    return this.offersService.create(createOfferDto);
  }
  

  /**
   * Obtiene todas las ofertas.
   */
  @MessagePattern('get_all_offers')
  async findAll() {
    return await this.offersService.findAll();
  }
    

  /**
   * Obtiene una oferta por su ID.
   * @param payload 
   */
  @MessagePattern('get_offer_by_id')
  async findOne(@Payload() payload: { id: string }) {
    const { id } = payload;

    if (!id || typeof id !== 'string') {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    return await this.offersService.findOne(id);
  }
 
  
  @MessagePattern('update_offer')
  async update(@Payload() payload: { id: string; dto: UpdateOfferDto }) {
    const { id, dto } = payload;

    if (!id || typeof id !== 'string') {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    if (!dto) {
      throw new BadRequestException('El DTO de actualización es obligatorio.');
    }

    return await this.offersService.update(id, dto);
  }

  /**
   * Elimina una oferta por su ID.
   * @param id 
  */
  @MessagePattern('delete_offer')
  async remove(@Payload() id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    return await this.offersService.remove(id);
  } 
}
