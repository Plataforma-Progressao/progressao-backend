import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_EXPIRES_IN_SECONDS: Joi.number().default(86400),
  CORS_ORIGIN: Joi.string().default('*'),
  ADMIN_EMAIL: Joi.string().email().default('admin@progressao.uf.br'),
  ADMIN_NAME: Joi.string().default('Admin'),
  ADMIN_PASSWORD: Joi.string().min(8).default('Admin@123456'),
});
