import { appwriteServer, serverHeaders } from '../server/appwrite';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mercado Pago signs every webhook with these headers. Requiring both keeps
  // the public relay from becoming an unauthenticated Appwrite execution proxy.
  const signature = String(req.headers?.['x-signature'] ?? '');
  const requestId = String(req.headers?.['x-request-id'] ?? '');
  if (!signature || !requestId) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  let parsed: any = {};
  try { parsed = JSON.parse(body); } catch {}
  const paymentId = String(req.query?.['data.id'] ?? parsed?.data?.id ?? '').trim();
  const path = paymentId ? `/?data.id=${encodeURIComponent(paymentId)}` : '/';

  try {
    const executionResponse = await fetch(
      `${appwriteServer.endpoint}/functions/mp-webhook/executions`,
      {
        method: 'POST',
        headers: serverHeaders(true),
        body: JSON.stringify({
          body,
          async: false,
          path,
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-signature': signature,
            'x-request-id': requestId,
          },
        }),
      },
    );

    if (!executionResponse.ok) {
      console.error(`Appwrite webhook relay failed (${executionResponse.status})`);
      return res.status(502).json({ error: 'Webhook relay failed' });
    }

    const execution: any = await executionResponse.json();
    const functionStatus = Number(execution.responseStatusCode ?? execution.statusCode ?? 200);
    if (functionStatus >= 400) {
      console.error(`mp-webhook execution returned ${functionStatus}`);
      return res.status(502).json({ error: 'Webhook processing failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('mp-webhook relay error', error);
    return res.status(502).json({ error: 'Webhook relay unavailable' });
  }
}
