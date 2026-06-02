import { config } from 'dotenv'; import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })
import { Client, Databases, Query } from 'node-appwrite'
const c=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)
const db=new Databases(c); const DB='pedago-db'
const FROM='https://appwrite.wsgestao.digital/v1/', TO='https://sitepedagogico.com.br/v1/'
// products
let cursor=null, prod=0
while(true){
  const q=[Query.limit(100)]; if(cursor)q.push(Query.cursorAfter(cursor))
  const r=await db.listDocuments(DB,'products',q)
  for(const p of r.documents){ if(p.coverImageUrl&&p.coverImageUrl.includes('appwrite.wsgestao.digital')){ await db.updateDocument(DB,'products',p.$id,{coverImageUrl:p.coverImageUrl.split(FROM).join(TO)}); prod++ } }
  if(r.documents.length<100)break; cursor=r.documents[r.documents.length-1].$id
}
// site_config
let cfg=0
const cfgs=await db.listDocuments(DB,'site_config',[Query.limit(100)])
for(const c2 of cfgs.documents){ if(typeof c2.value==='string'&&c2.value.includes('appwrite.wsgestao.digital')){ await db.updateDocument(DB,'site_config',c2.$id,{value:c2.value.split(FROM).join(TO)}); cfg++ } }
console.log(`reescrito -> produtos: ${prod}, site_config: ${cfg}`)
