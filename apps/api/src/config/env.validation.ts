import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsOptional, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString() DATABASE_URL: string;
  @IsString() @IsOptional() REDIS_URL: string;
  @IsString() JWT_ACCESS_SECRET: string;
  @IsString() JWT_REFRESH_SECRET: string;
  @IsString() @IsOptional() JWT_ACCESS_EXPIRES_IN: string = '15m';
  @IsString() @IsOptional() JWT_REFRESH_EXPIRES_IN: string = '7d';
  @IsString() @IsOptional() GOOGLE_CLIENT_ID: string;
  @IsString() @IsOptional() GOOGLE_CLIENT_SECRET: string;
  @IsString() @IsOptional() GOOGLE_CALLBACK_URL: string;
  @IsString() MERCADO_PAGO_ACCESS_TOKEN: string;
  @IsString() @IsOptional() MERCADO_PAGO_WEBHOOK_SECRET: string;
  @IsString() @IsOptional() MERCADO_PAGO_PIX_KEY: string;
  @IsString() @IsOptional() FRONTEND_URL: string = 'http://localhost:5173';
  @IsString() @IsOptional() NODE_ENV: string = 'development';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
