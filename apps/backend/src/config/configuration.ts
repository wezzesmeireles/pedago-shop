export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3000', 10),

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  supabase: {
    jwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
    url: process.env.SUPABASE_URL ?? '',
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.S3_PORT ?? '9000', 10),
    useSsl: process.env.S3_USE_SSL === 'true',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
    bucketCovers: process.env.S3_BUCKET_COVERS ?? 'product-covers',
    bucketPreviews: process.env.S3_BUCKET_PREVIEWS ?? 'product-previews',
    bucketFiles: process.env.S3_BUCKET_FILES ?? 'product-files',
    publicUrl: process.env.S3_PUBLIC_URL ?? 'http://localhost:9000',
  },

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
});
