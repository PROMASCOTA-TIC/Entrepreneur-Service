import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Dialect } from 'sequelize';
import { envs } from '../config/env';
import { OffersModule } from './offers/offers.module';
import { Offer } from './offers/models/offer.model';

@Module({
  imports: [
    OffersModule,
    SequelizeModule.forRoot({
      dialect: envs.dbDialect as Dialect,
      logging: console.log,
      username: envs.dbOffersUsername,
      password: envs.dbOffersPassword,
      synchronize: true,
      autoLoadModels: true,
      dialectOptions: {
        connectString: envs.connectionString,
      },
      models: [Offer],
    }),
    SequelizeModule.forFeature([Offer]),
  ],
  controllers: [],
  providers: [],
})

export class AppModule {}
console.log(envs);