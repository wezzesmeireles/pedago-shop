import { describe, it, expect } from 'vitest';
import { resolveEndpoint } from './endpoint';

describe('resolveEndpoint', () => {
  it('web: troca o host pelo origin atual (proxy mesma origem)', () => {
    const url = resolveEndpoint({
      configured: 'https://sitepedagogico.com.br/v1',
      origin: 'https://www.sitepedagogico.com.br',
      isMobile: false,
    });
    expect(url).toBe('https://www.sitepedagogico.com.br/v1');
  });

  it('web sem window: usa o endpoint configurado', () => {
    const url = resolveEndpoint({
      configured: 'https://sitepedagogico.com.br/v1',
      origin: undefined,
      isMobile: false,
    });
    expect(url).toBe('https://sitepedagogico.com.br/v1');
  });

  it('mobile: usa o endpoint absoluto, ignora o origin localhost', () => {
    const url = resolveEndpoint({
      configured: 'https://sitepedagogico.com.br/v1',
      origin: 'https://localhost',
      isMobile: true,
    });
    expect(url).toBe('https://sitepedagogico.com.br/v1');
  });

  it('web: endpoint só com path cai pro origin', () => {
    const url = resolveEndpoint({
      configured: '/v1',
      origin: 'https://www.sitepedagogico.com.br',
      isMobile: false,
    });
    expect(url).toBe('https://www.sitepedagogico.com.br/v1');
  });
});
