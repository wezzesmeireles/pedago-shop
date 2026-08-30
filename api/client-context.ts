function firstHeader(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || '').split(',')[0].trim().slice(0, 64);
}

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ip = firstHeader(req.headers['x-vercel-forwarded-for'] as string | string[] | undefined)
    || firstHeader(req.headers['x-forwarded-for'])
    || firstHeader(req.headers['x-real-ip'] as string | string[] | undefined);

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.status(200).json({ ip });
}
