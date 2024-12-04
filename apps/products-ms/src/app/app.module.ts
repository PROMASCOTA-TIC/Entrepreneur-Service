import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { envs } from '../config';
import { Dialect } from 'sequelize';
import { Product } from './products/models/products.models';
@Module({
  imports: [
    ProductsModule,
    SequelizeModule.forRoot({
      dialect: envs.dbDialect as Dialect,
      logging: console.log,
      username: envs.dbIncomeUsername,
      password: envs.dbIncomePassword,
      synchronize: true,
      autoLoadModels: true,
      dialectOptions: {
        connectString: envs.connectionString,
      },
      models: [Product],
    })
  ],
  controllers: [],
  providers: [],
})

export class AppModule {}
console.log(envs);
