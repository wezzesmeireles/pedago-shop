type UnknownRecord = Record<string, unknown>;

export interface PixPaymentData {
  qrCode: string;
  qrCodeBase64: string;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {};
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stripDataUrl(value: string): string {
  return value.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
}

/**
 * Aceita tanto o contrato normalizado da Function quanto o payload bruto do
 * Mercado Pago. Isso mantém o checkout compatível durante atualizações do
 * backend e evita uma tela de carregamento infinita quando o formato muda.
 */
export function normalizePixPayment(response: unknown): PixPaymentData {
  const root = asRecord(response);
  const payment = Object.keys(asRecord(root.payment)).length
    ? asRecord(root.payment)
    : root;
  const pointOfInteraction = asRecord(
    payment.point_of_interaction ?? root.point_of_interaction,
  );
  const transaction = asRecord(pointOfInteraction.transaction_data);

  const qrCode = asText(
    payment.qrCode ?? payment.qr_code ?? transaction.qr_code,
  );
  const qrCodeBase64 = stripDataUrl(asText(
    payment.qrCodeBase64 ?? payment.qr_code_base64 ?? transaction.qr_code_base64,
  ));

  return { qrCode, qrCodeBase64 };
}
