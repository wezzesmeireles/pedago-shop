import { describe, expect, it } from 'vitest';
import { isIosDevice, pdfFilename, tokenDownloadPath } from './download';

describe('tokenDownloadPath', () => {
  it('monta a rota da API para um token simples', () => {
    expect(tokenDownloadPath('abc123')).toBe('/api/download?token=abc123');
  });

  it('codifica caracteres que poderiam quebrar a query string', () => {
    expect(tokenDownloadPath('abc+123&next=/admin')).toBe(
      '/api/download?token=abc%2B123%26next%3D%2Fadmin',
    );
  });
});

describe('pdfFilename', () => {
  it('gera um nome seguro e mantém apenas uma extensão PDF', () => {
    expect(pdfFilename('O Caldeirão da Cuca.pdf')).toBe('o_caldeirao_da_cuca.pdf');
  });
});

describe('isIosDevice', () => {
  it('detecta iPhone pelo user agent', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5)).toBe(true);
  });

  it('detecta iPad moderno que se identifica como Mac', () => {
    expect(isIosDevice('Mozilla/5.0 (Macintosh)', 'MacIntel', 5)).toBe(true);
  });

  it('não marca um computador Mac como iOS', () => {
    expect(isIosDevice('Mozilla/5.0 (Macintosh)', 'MacIntel', 0)).toBe(false);
  });
});
