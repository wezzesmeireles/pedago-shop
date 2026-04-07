import { PrismaClient } from '@prisma/client';
import { DEFAULT_SITE_CONFIG } from '@pedago/shared';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@pedago.shop' },
    update: {},
    create: {
      email: 'admin@pedago.shop',
      name: 'Administrador',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Seed site config
  await prisma.siteConfig.upsert({
    where: { key: 'global' },
    update: { value: DEFAULT_SITE_CONFIG as any },
    create: { key: 'global', value: DEFAULT_SITE_CONFIG as any },
  });

  // Seed categories
  const categoryData = [
    { name: 'Alfabetização', slug: 'alfabetizacao', sortOrder: 1 },
    { name: 'Matemática', slug: 'matematica', sortOrder: 2 },
    { name: 'Animais', slug: 'animais', sortOrder: 3 },
    { name: 'Números', slug: 'numeros', sortOrder: 4 },
    { name: 'Letras', slug: 'letras', sortOrder: 5 },
    { name: 'Artes', slug: 'artes', sortOrder: 6 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }

  // Seed demo products
  const products = [
    {
      name: 'Atividades de Alfabetização - Vogais',
      slug: 'atividades-alfabetizacao-vogais',
      description: 'Apostila completa com atividades lúdicas para o aprendizado das vogais. Inclui exercícios de traçado, colorir e identificar as letras A, E, I, O, U.',
      price: 12.90,
      comparePrice: 18.90,
      coverImageUrl: 'https://picsum.photos/seed/alfa1/400/400',
      categoryId: categories['alfabetizacao'],
      pageCount: 32,
      tags: ['vogais', 'alfabetização', 'educação infantil'],
      isFeatured: true,
      sortOrder: 1,
      r2FileKey: 'products/demo/vogais.pdf',
      fileSize: 1024000,
      maxDownloads: 5,
    },
    {
      name: 'Cartilha de Consoantes - Letra a Letra',
      slug: 'cartilha-consoantes-letra-a-letra',
      description: 'Material didático com atividades para o aprendizado de todas as consoantes do alfabeto. Exercícios progressivos e ilustrados.',
      price: 15.90,
      coverImageUrl: 'https://picsum.photos/seed/alfa2/400/400',
      categoryId: categories['alfabetizacao'],
      pageCount: 48,
      tags: ['consoantes', 'alfabeto', 'alfabetização'],
      isFeatured: true,
      sortOrder: 2,
      r2FileKey: 'products/demo/consoantes.pdf',
      fileSize: 2048000,
      maxDownloads: 5,
    },
    {
      name: 'Matemática Divertida - Adição e Subtração',
      slug: 'matematica-divertida-adicao-subtracao',
      description: 'Apostila com exercícios de adição e subtração para crianças do 1º ao 3º ano. Utiliza situações do cotidiano para tornar o aprendizado mais significativo.',
      price: 14.90,
      comparePrice: 22.00,
      coverImageUrl: 'https://picsum.photos/seed/mat1/400/400',
      categoryId: categories['matematica'],
      pageCount: 40,
      tags: ['adição', 'subtração', 'matemática', '1º ano'],
      isFeatured: true,
      sortOrder: 3,
      r2FileKey: 'products/demo/adicao-subtracao.pdf',
      fileSize: 1800000,
      maxDownloads: 5,
    },
    {
      name: 'Tabuada Completa com Atividades',
      slug: 'tabuada-completa-com-atividades',
      description: 'Material completo com a tabuada de multiplicação de 1 a 10, acompanhado de exercícios práticos e jogos para fixação.',
      price: 11.90,
      coverImageUrl: 'https://picsum.photos/seed/mat2/400/400',
      categoryId: categories['matematica'],
      pageCount: 28,
      tags: ['tabuada', 'multiplicação', 'matemática'],
      isFeatured: false,
      sortOrder: 4,
      r2FileKey: 'products/demo/tabuada.pdf',
      fileSize: 900000,
      maxDownloads: 5,
    },
    {
      name: 'O Mundo dos Animais - Atividades Educativas',
      slug: 'mundo-animais-atividades-educativas',
      description: 'Apostila com atividades sobre animais domésticos, selvagens e marinhos. Inclui fichas informativas, colorir e completar.',
      price: 13.90,
      comparePrice: 19.90,
      coverImageUrl: 'https://picsum.photos/seed/ani1/400/400',
      categoryId: categories['animais'],
      pageCount: 36,
      tags: ['animais', 'ciências', 'natureza'],
      isFeatured: true,
      sortOrder: 5,
      r2FileKey: 'products/demo/animais.pdf',
      fileSize: 3200000,
      maxDownloads: 5,
    },
    {
      name: 'Animais da Fazenda - Livro de Atividades',
      slug: 'animais-fazenda-livro-atividades',
      description: 'Atividades lúdicas sobre os animais da fazenda. Perfeito para educação infantil com ilustrações coloridas e exercícios de coordenação motora.',
      price: 10.90,
      coverImageUrl: 'https://picsum.photos/seed/ani2/400/400',
      categoryId: categories['animais'],
      pageCount: 24,
      tags: ['fazenda', 'animais', 'educação infantil'],
      isFeatured: false,
      sortOrder: 6,
      r2FileKey: 'products/demo/animais-fazenda.pdf',
      fileSize: 1500000,
      maxDownloads: 5,
    },
    {
      name: 'Números de 1 a 100 - Atividades Progressivas',
      slug: 'numeros-1-100-atividades-progressivas',
      description: 'Apostila completa para o aprendizado dos números de 1 a 100. Inclui contagem, sequência numérica, comparação e situações-problema.',
      price: 16.90,
      comparePrice: 24.90,
      coverImageUrl: 'https://picsum.photos/seed/num1/400/400',
      categoryId: categories['numeros'],
      pageCount: 52,
      tags: ['números', 'contagem', 'matemática'],
      isFeatured: true,
      sortOrder: 7,
      r2FileKey: 'products/demo/numeros.pdf',
      fileSize: 2400000,
      maxDownloads: 5,
    },
    {
      name: 'Arte e Criatividade - Técnicas para Crianças',
      slug: 'arte-criatividade-tecnicas-criancas',
      description: 'Material com introdução às artes visuais: pintura, colagem, desenho e escultura. Ideal para aulas de artes do ensino fundamental.',
      price: 18.90,
      coverImageUrl: 'https://picsum.photos/seed/art1/400/400',
      categoryId: categories['artes'],
      pageCount: 44,
      tags: ['artes', 'criatividade', 'pintura', 'desenho'],
      isFeatured: true,
      sortOrder: 8,
      r2FileKey: 'products/demo/artes.pdf',
      fileSize: 4000000,
      maxDownloads: 5,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product as any,
    });
  }

  console.log('Seed concluído com sucesso!');
  console.log('Admin: admin@sitepedagogico.com / Admin@123');
  console.log(`${products.length} produtos demo criados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
