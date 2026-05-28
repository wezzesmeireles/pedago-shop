import { Global, Module, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA = 'PRISMA';

const prismaProvider = {
  provide: PRISMA,
  useFactory: async () => {
    const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
    });
    await prisma.$connect();
    return prisma;
  },
};

@Global()
@Module({
  providers: [prismaProvider],
  exports: [PRISMA],
})
export class DatabaseModule implements OnModuleInit {
  constructor() {}

  async onModuleInit() {}
}
