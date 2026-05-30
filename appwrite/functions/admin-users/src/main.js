import { Client, Users, Databases, Query, Account } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // Check caller is admin
  const callerToken = req.headers?.['x-appwrite-session'] ?? req.headers?.['authorization']?.replace('Bearer ', '')
  if (!callerToken) {
    return res.json({ error: 'Unauthorized' }, 401)
  }

  const userClient = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setSession(callerToken)

  try {
    const userAccount = new Account(userClient)
    const caller = await userAccount.get()
    const callerProfiles = await db.listDocuments(DB, 'profiles', [
      Query.equal('userId', caller.$id),
      Query.equal('role', 'ADMIN'),
      Query.limit(1),
    ])
    if (callerProfiles.total === 0) {
      return res.json({ error: 'Forbidden' }, 403)
    }
  } catch {
    return res.json({ error: 'Unauthorized' }, 401)
  }

  if (req.method === 'PATCH') {
    let body
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
      return res.json({ error: 'Invalid JSON' }, 400)
    }
    const { userId, phone } = body ?? {}
    if (!userId) return res.json({ error: 'userId required' }, 400)

    const profilesResult = await db.listDocuments(DB, 'profiles', [
      Query.equal('userId', userId),
      Query.limit(1),
    ])
    const profile = profilesResult.documents[0]
    if (!profile) return res.json({ error: 'Profile not found' }, 404)

    await db.updateDocument(DB, 'profiles', profile.$id, {
      phone: phone ?? '',
      updatedAt: new Date().toISOString(),
    })
    return res.json({ ok: true })
  }

  // GET: list users with search, limit, offset
  const search = req.query?.search ?? ''
  const limit = Math.min(parseInt(req.query?.limit ?? '50'), 100)
  const offset = parseInt(req.query?.offset ?? '0')

  const [appwriteUsers, profilesResult, ordersResult] = await Promise.all([
    users.list([], search || undefined, limit, offset),
    db.listDocuments(DB, 'profiles', [Query.limit(500)]),
    db.listDocuments(DB, 'orders', [Query.limit(2000)]),
  ])

  const result = appwriteUsers.users.map(u => {
    const profile = profilesResult.documents.find(p => p.userId === u.$id)
    const orderCount = ordersResult.documents.filter(o => o.userId === u.$id).length
    return {
      id: u.$id,
      email: u.email,
      name: u.name,
      phone: profile?.phone ?? '',
      role: profile?.role ?? 'CUSTOMER',
      isActive: profile?.isActive ?? true,
      avatarUrl: profile?.avatarUrl ?? '',
      orderCount,
      createdAt: u.$createdAt,
    }
  })

  return res.json({ users: result, total: appwriteUsers.total })
}
