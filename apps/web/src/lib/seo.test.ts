import { describe, expect, it } from 'vitest';
import { categoryPath, categorySeoSlug } from './seo';

describe('category SEO URLs', () => {
  it('normalizes uppercase, accents and spaces into a stable slug', () => {
    expect(categorySeoSlug('DIA DA ÁRVORE')).toBe('dia-da-arvore');
    expect(categorySeoSlug('FESTA JUNINA')).toBe('festa-junina');
  });

  it('creates a clean category path and falls back to the catalog', () => {
    expect(categoryPath('Folclore')).toBe('/atividades/folclore');
    expect(categoryPath('')).toBe('/catalogo');
  });
});
