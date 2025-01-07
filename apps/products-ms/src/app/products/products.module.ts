import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './models/products.models';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PetType } from './models/pettype.models';
import { Category } from './models/category.models';
import { Subcategory } from './models/subcategory.models';
import { Sign } from 'crypto';
import { Size } from './models/size.models';

@Module({
  imports: [
    SequelizeModule.forFeature([Product,PetType,Category,Subcategory,Size]),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_SERVERS || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
