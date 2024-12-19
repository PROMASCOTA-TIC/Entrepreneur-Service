import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';
import { envs } from '../config/env';
import { OffersModule } from './offers/offers.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    OffersModule,
    ScheduleModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: envs.dbDialect as Dialect,
      logging: console.log,
      username: envs.dbOffersUsername,
      password: envs.dbOffersPassword,
      synchronize: true, // Cuidado: no recomendado en producción
      autoLoadModels: true,
      dialectOptions: {
        connectString: envs.connectionString,
      },
     
    }),
  ],
  controllers: [],
  providers: [OffersModule],
})
export class AppModule {}

console.log(envs); // Verifica las variables de entorno
