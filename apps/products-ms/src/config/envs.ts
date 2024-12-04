import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    // INCOME_PORT: number;
    DB_DIALECT: string;
    DB_INCOME_USERNAME: string;
    DB_INCOME_PASSWORD: string;
    CONNECTION_STRING: string;
    NATS_SERVERS: string[];
}

const envsSchema = joi.object({
    // INCOME_PORT: joi.number().required(),
    DB_DIALECT: joi.string().required(),
    DB_INCOME_USERNAME: joi.string().required(),
    DB_INCOME_PASSWORD: joi.string().required(),
    CONNECTION_STRING: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
}).unknown(true);

const { error, value } = envsSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    // incomePort: envVars.INCOME_PORT,
    dbDialect: envVars.DB_DIALECT,
    dbIncomeUsername: envVars.DB_INCOME_USERNAME,
    dbIncomePassword: envVars.DB_INCOME_PASSWORD,
    connectionString: envVars.CONNECTION_STRING,
    natsServers: envVars.NATS_SERVERS,
}