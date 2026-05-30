import { Client, Users, Databases, ID } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, password, name, phone } = body ?? {}
  if (!email || !password || !name) {
    return res.json({ error: 'email, password and name are required' }, 400)
  }

  let user
  try {
    user = await users.create(ID.unique(), email, phone ?? undefined, password, name)
  } catch (err) {
    if (err.code === 409) return res.json({ error: 'Email already registered' }, 409)
    error(err.message)
    return res.json({ error: 'Failed to create user' }, 500)
  }

  const now = new Date().toISOString()
  try {
    await db.createDocument(DB, 'profiles', user.$id, {
      userId: user.$id,
      name,
      email,
      phone: phone ?? '',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  } catch (err) {
    error(`Profile creation failed for ${user.$id}: ${err.message}`)
    // User created but profile failed — log but return success so client can proceed
  }

  return res.json({ id: user.$id, email: user.email }, 201)
}
