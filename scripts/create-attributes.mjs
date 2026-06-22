const PROJECT = '6a1bc2b1000d09c3f5f1';
const KEY = 'standard_01cb98a9d1d0c60029dddeb83dc3f523d05e533593f8c5fe1b58f682bf6bdfaaa5111d1acd8a8264d176d837f72f43c5632ee91262eec31a5bc2b68bf33c34830d60a853df5f43545b93b18adea834fbdb92e4f3b95b62777da6c5aadb3a648c677eea243455e21c90fa55f8f9b3219c7315f25f724cb276ea457b6d0dd02384';
const BASE = 'https://appwrite.wsgestao.digital/v1';

async function createAttr(type, payload) {
  const url = `${BASE}/databases/pedago-db/collections/recovery_tokens/attributes/${type}`;
  const body = new URLSearchParams(payload).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }
  return res.json();
}

async function main() {
  const attrs = [
    createAttr('string', { key: 'token', size: '128', required: 'true' }),
    createAttr('string', { key: 'userId', size: '36', required: 'true' }),
    createAttr('string', { key: 'email', size: '255', required: 'true' }),
    createAttr('datetime', { key: 'expiresAt', required: 'true' }),
  ];
  const results = await Promise.allSettled(attrs);
  results.forEach((r, i) => {
    const names = ['token', 'userId', 'email', 'expiresAt'];
    if (r.status === 'fulfilled') console.log('✓', names[i]);
    else console.log('✗', names[i], '—', r.reason?.message || r.reason);
  });
}

main();
