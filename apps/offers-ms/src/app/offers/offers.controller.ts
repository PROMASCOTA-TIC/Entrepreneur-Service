import { BadRequestException, Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @MessagePattern('create_offer')
  async create(@Payload() createOfferDto: CreateOfferDto) {
    return await this.offersService.create(createOfferDto);
  }

  @MessagePattern('get_all_offers')
  async findAll() {
    return await this.offersService.findAll();
  }

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
    return await this.offersService.update(id, dto);
  }

/**
 * Elimina una oferta por su ID.
 * @param id - ID de la oferta.
 * @returns Una confirmación de eliminación.
 */
@MessagePattern('delete_offer') // Patrón para eliminar una oferta
async remove(@Payload() id: string) {
  return await this.offersService.remove(id); // Devuelve la respuesta del servicio
}

}
