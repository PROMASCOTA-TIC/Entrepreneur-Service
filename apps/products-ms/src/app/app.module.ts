import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { envs } from '../config';
import { Dialect } from 'sequelize';
import { Product } from './products/models/products.models';
import { Category } from './products/models/category.models';
import { PetType } from './products/models/pettype.models';
import { Size } from './products/models/size.models';
import { Subcategory } from './products/models/subcategory.models';
@Module({
  imports: [
    ProductsModule,
    SequelizeModule.forRoot({
      dialect: envs.dbDialect as Dialect,
      logging: console.log,
      username: envs.dbProductsUsername,
      password: envs.dbProductsPassword,
      synchronize: true,
      autoLoadModels: true,
      dialectOptions: {
        connectString: envs.connectionString,
      },
      models: [Product,Category,PetType,Size,Subcategory],
    }),
    SequelizeModule.forFeature([Product, PetType, Category, Subcategory, Size]),
  ],
  controllers: [],
  providers: [],
})

export class AppModule {}
console.log(envs);
