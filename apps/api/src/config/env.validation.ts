import { plainToInstance } from 'class-transformer';
import { IsString, IsOptional, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString() SUPABASE_URL: string;
  @IsString() SUPABASE_SERVICE_ROLE_KEY: string;
  @IsString() SUPABASE_JWT_SECRET: string;
  @IsString() @IsOptional() SUPABASE_ANON_KEY: string;
  @IsString() @IsOptional() MERCADO_PAGO_ACCESS_TOKEN: string;
  @IsString() @IsOptional() MERCADO_PAGO_WEBHOOK_SECRET: string;
  @IsString() @IsOptional() MERCADO_PAGO_PIX_KEY: string;
  @IsString() @IsOptional() FRONTEND_URL: string = 'http://localhost:5173';
  @IsString() @IsOptional() API_URL: string;
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
