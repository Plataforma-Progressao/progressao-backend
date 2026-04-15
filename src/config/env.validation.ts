import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_EXPIRES_IN_SECONDS: Joi.number().default(900),
  JWT_REFRESH_EXPIRES_IN_SECONDS: Joi.number().default(604800),
  RESET_PASSWORD_TOKEN_EXPIRES_MINUTES: Joi.number().default(30),
  AUTH_EXPOSE_RESET_TOKEN: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().valid(false).default(false),
    otherwise: Joi.boolean().default(false),
  }),
  CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
  ADMIN_EMAIL: Joi.string().email().default('admin@progressao.uf.br'),
  ADMIN_NAME: Joi.string().default('Admin'),
  ADMIN_PASSWORD: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(12).required(),
    otherwise: Joi.string().min(8).default('Admin@123456'),
  }),
});
