import { describe, expect, it } from 'vitest';
import { normalizePixPayment } from './pix-payment';

describe('normalizePixPayment', () => {
  it('lê o contrato normalizado da Function', () => {
    expect(normalizePixPayment({
      payment: { qrCode: '000201...', qrCodeBase64: 'aW1hZ2Vt' },
    })).toEqual({ qrCode: '000201...', qrCodeBase64: 'aW1hZ2Vt' });
  });

  it('lê o formato bruto do Mercado Pago', () => {
    expect(normalizePixPayment({
      point_of_interaction: {
        transaction_data: {
          qr_code: '000201-raw',
          qr_code_base64: 'cmF3LWltYWdl',
        },
      },
    })).toEqual({ qrCode: '000201-raw', qrCodeBase64: 'cmF3LWltYWdl' });
  });

  it('remove o prefixo data URL da imagem base64', () => {
    expect(normalizePixPayment({
      payment: { qrCodeBase64: 'data:image/png;base64,aW1hZ2Vt' },
    }).qrCodeBase64).toBe('aW1hZ2Vt');
  });

  it('retorna valores vazios para uma resposta sem dados PIX', () => {
    expect(normalizePixPayment({ payment: { status: 'pending' } })).toEqual({
      qrCode: '',
      qrCodeBase64: '',
    });
  });
});
