import { Client, Users, Databases, ID, Query } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // Check if admin already exists (correct query with limit)
  const adminCheck = await db.listDocuments(DB, 'profiles', [
    Query.equal('role', 'ADMIN'),
    Query.limit(1),
  ])
  if (adminCheck.total > 0) {
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

  let user
  try {
    user = await users.create(ID.unique(), email, undefined, password, name ?? 'Admin')
  } catch (err) {
    if (err.code === 409) return res.json({ error: 'Email already registered' }, 409)
    error(err.message)
    return res.json({ error: 'Failed to create user' }, 500)
  }

  const now = new Date().toISOString()
  try {
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
    // Set admin label
    await users.updateLabels(user.$id, ['admin'])
  } catch (err) {
    // Rollback: delete the Auth user if profile creation failed
    try { await users.deleteUser(user.$id) } catch {}
    error(err.message)
    return res.json({ error: 'Failed to create admin profile' }, 500)
  }

  return res.json({ id: user.$id, email: user.email, role: 'ADMIN' }, 201)
}
