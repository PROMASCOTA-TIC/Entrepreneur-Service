import { BadRequestException, Controller, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Controller()
export class OffersController {
  private readonly logger = new Logger(OffersController.name);

  constructor(private readonly offersService: OffersService) {}

  //Endpoint para crear una nueva oferta
  
  @MessagePattern('create_offer')
  async handleCreateOffer(@Payload() createOfferDto: CreateOfferDto) {
    this.logger.log(`Received create_offer pattern for productId: ${createOfferDto.productId}`);
    return this.offersService.create(createOfferDto);
  }
  
 //Endpoint para obtener todas las ofertas
  @MessagePattern('get_all_offers')
  async findAll() {
    return await this.offersService.findAll();
  }
    
  //Endpoint para obtener una oferta por su ID
 
  @MessagePattern('get_offer_by_id')
  async findOne(@Payload() payload: { id: string }) {
    const { id } = payload;

    if (!id || typeof id !== 'string') {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    return await this.offersService.findOne(id);
  }
 
 //Endpoint para actualizar una oferta por su ID 
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

  //Endpoint para eliminar una oferta por su ID
  @MessagePattern('delete_offer')
  async remove(@Payload() id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    return await this.offersService.remove(id);
  } 

//Endpoint para obtener todas las ofertas de un emprendedor
  @MessagePattern('get_offers_by_entrepreneur')
  async findByEntrepreneurId(@Payload() entrepreneurId: string) {
   this.logger.log(`Received get_offers_by_entrepreneur_id pattern for entrepreneurId: ${entrepreneurId}`);
   try {
      return await this.offersService.findOfferByEntrepreneurId(entrepreneurId);
    } catch (error) {
      this.logger.error(`Error while trying to get offers by entrepreneur ID: ${error.message}`);
      throw new HttpException(
        `Error al obtener ofertas: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    } 
  }
}
