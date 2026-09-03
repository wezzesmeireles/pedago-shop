import { describe, expect, it } from 'vitest';
import { tokenDownloadPath } from './download';

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
