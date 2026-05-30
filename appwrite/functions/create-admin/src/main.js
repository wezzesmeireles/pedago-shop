import { Client, Users, Databases, ID } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const profilesResult = await db.listDocuments(DB, 'profiles', [])
  const existingAdmin = profilesResult.documents.find(p => p.role === 'ADMIN')
  if (existingAdmin) {
    return res.json({ error: 'Admin already exists' }, 409)
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, password, name } = body
  if (!email || !password) return res.json({ error: 'email and password required' }, 400)

  const user = await users.create(ID.unique(), email, undefined, password, name ?? 'Admin')

  const now = new Date().toISOString()
  await db.createDocument(DB, 'profiles', user.$id, {
    userId: user.$id,
    name: name ?? 'Admin',
    email,
    phone: '',
    role: 'ADMIN',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })

  return res.json({ id: user.$id, email: user.email, role: 'ADMIN' }, 201)
}
