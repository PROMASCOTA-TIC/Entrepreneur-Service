import 'dotenv/config';
import * as joi from 'joi';

// Define la interfaz para las variables de entorno
interface EnvVars {
  DB_DIALECT: string;
  DB_OFFERS_USERNAME: string;
  DB_OFFERS_PASSWORD: string;
  CONNECTION_STRING: string;
  NATS_SERVERS: string[];
}

// Esquema de validación con Joi
const envsSchema = joi.object({
  DB_DIALECT: joi.string().required().messages({
    'any.required': 'DB_DIALECT es obligatorio.',
    'string.base': 'DB_DIALECT debe ser un texto válido.',
  }),
  DB_OFFERS_USERNAME: joi.string().required().messages({
    'any.required': 'DB_OFFERS_USERNAME es obligatorio.',
  }),
  DB_OFFERS_PASSWORD: joi.string().required().messages({
    'any.required': 'DB_OFFERS_PASSWORD es obligatorio.',
  }),
  CONNECTION_STRING: joi.string().required().messages({
    'any.required': 'CONNECTION_STRING es obligatorio.',
  }),
  NATS_SERVERS: joi.array().items(joi.string()).required().messages({
    'any.required': 'NATS_SERVERS es obligatorio.',
    'array.base': 'NATS_SERVERS debe ser un arreglo de cadenas de texto.',
  }),
}).unknown(true);

// Validar las variables de entorno cargadas desde .env
const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Mapear las variables validadas a una interfaz fuerte
const envVars: EnvVars = value;

// Exportar las variables de entorno
export const envs = {
  dbDialect: envVars.DB_DIALECT,
  dbOffersUsername: envVars.DB_OFFERS_USERNAME,
  dbOffersPassword: envVars.DB_OFFERS_PASSWORD,
  connectionString: envVars.CONNECTION_STRING,
  natsServers: envVars.NATS_SERVERS,
};


if (process.env.NODE_ENV !== 'production') {
  console.log('Variables cargadas desde .env:', envs);
}