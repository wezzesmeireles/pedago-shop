import { Client, Functions } from 'node-appwrite';
import { readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import * as tar from 'tar';

const client = new Client()
  .setEndpoint('https://appwrite.wsgestao.digital/v1')
  .setProject('6a1bc2b1000d09c3f5f1')
  .setKey('standard_8a8cbeb93825163f891428794842cbc66f4a794b281c24ca7149627b4b46dea002de70148111cbf9083defdc721d97009e0fad63dece74e7cac3f26c37f4b340cf567feee02533185750e0e16c275eb3ef182d6566fa91659b72cc3acf35e14853d9b08d08a35b4e6a382ca771556605a3bd603dd1972a46152bfe4b88d325d0');

const functions = new Functions(client);

async function deploy(fnName) {
  const dir = join(process.cwd(), 'appwrite/functions', fnName);
  const tarPath = join(process.cwd(), 'appwrite/functions', `${fnName}.tar.gz`);
  
  console.log(`Packaging ${fnName}...`);
  await tar.create({ gzip: true, file: tarPath, cwd: dir, portable: true }, ['.']);
  
  console.log(`Uploading ${fnName} to Appwrite...`);
  const tarBuffer = readFileSync(tarPath);
  const tarFile = new File([tarBuffer], `${fnName}.tar.gz`, { type: 'application/gzip' });
  
  const dep = await functions.createDeployment(fnName, tarFile, true, 'src/main.js', '');
  console.log(`Successfully deployed ${fnName}! Deployment ID: ${dep.$id}`);
  rmSync(tarPath);
}

async function main() {
  const targets = process.argv.slice(2).length > 0 
    ? process.argv.slice(2) 
    : ['create-order', 'mp-webhook', 'reconcile-orders'];
  
  for (const fn of targets) {
    await deploy(fn);
  }
}

main().catch(console.error);
