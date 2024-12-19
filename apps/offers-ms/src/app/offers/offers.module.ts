import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer } from './models/offer.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Offer]), 
    ClientsModule.register([
      {
        name: 'PRODUCTS_SERVICE', 
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'], // URL de NATS
        },
      },
    ]),
  ],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
