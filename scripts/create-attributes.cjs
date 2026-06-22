const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint('https://appwrite.wsgestao.digital/v1')
  .setProject('6a1bc2b1000d09c3f5f1')
  .setKey('standard_01cb98a9d1d0c60029dddeb83dc3f523d05e533593f8c5fe1b58f682bf6bdfaaa5111d1acd8a8264d176d837f72f43c5632ee91262eec31a5bc2b68bf33c34830d60a853df5f43545b93b18adea834fbdb92e4f3b95b62777da6c5aadb3a648c677eea243455e21c90fa55f8f9b3219c7315f25f724cb276ea457b6d0dd02384');

const db = new sdk.Databases(client);

async function main() {
  try {
    await db.createStringAttribute('pedago-db', 'recovery_tokens', 'token', 128, true);
    console.log('✓ token');
  } catch (e) { console.log('token:', e.message); }

  try {
    await db.createStringAttribute('pedago-db', 'recovery_tokens', 'userId', 36, true);
    console.log('✓ userId');
  } catch (e) { console.log('userId:', e.message); }

  try {
    await db.createStringAttribute('pedago-db', 'recovery_tokens', 'email', 255, true);
    console.log('✓ email');
  } catch (e) { console.log('email:', e.message); }

  try {
    await db.createDatetimeAttribute('pedago-db', 'recovery_tokens', 'expiresAt', true);
    console.log('✓ expiresAt');
  } catch (e) { console.log('expiresAt:', e.message); }
}

main();
