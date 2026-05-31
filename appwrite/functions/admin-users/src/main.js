import { Client, Users, Databases, Query } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  if (req.method === 'PATCH') {
    let body
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
      return res.json({ error: 'Invalid JSON body' }, 400)
    }
    const { userId, phone } = body
    if (!userId) return res.json({ error: 'userId required' }, 400)

    const profilesResult = await db.listDocuments(DB, 'profiles', [
      Query.equal('userId', userId), Query.limit(1),
    ])
    const profile = profilesResult.documents[0]
    if (!profile) return res.json({ error: 'Profile not found' }, 404)

    await db.updateDocument(DB, 'profiles', profile.$id, {
      phone: phone ?? '',
      updatedAt: new Date().toISOString(),
    })
    return res.json({ ok: true })
  }

  // GET: list users — params can come from query string or POST body
  let bodyParams = {}
  if (req.body) {
    try { bodyParams = typeof req.body === 'string' ? JSON.parse(req.body) : req.body } catch {}
  }
  const search = req.query?.search ?? bodyParams.search ?? ''
  const limit = Math.min(parseInt(req.query?.limit ?? bodyParams.limit ?? '50'), 100)
  const offset = parseInt(req.query?.offset ?? bodyParams.offset ?? '0')

  const userQueries = [Query.limit(limit), Query.offset(offset)]
  if (search) userQueries.push(Query.search('name', search))

  const appwriteUsers = await users.list(userQueries)

  // Fetch profiles only for the users we need (by userId)
  const userIds = appwriteUsers.users.map(u => u.$id)

  let profileMap = {}
  if (userIds.length > 0) {
    const profilesResult = await db.listDocuments(DB, 'profiles', [
      Query.equal('userId', userIds),
      Query.limit(userIds.length),
    ])
    for (const p of profilesResult.documents) {
      profileMap[p.userId] = p
    }
  }

  // Count orders per user (fetch only for this page's users)
  let orderCountMap = {}
  if (userIds.length > 0) {
    const ordersResult = await db.listDocuments(DB, 'orders', [
      Query.equal('userId', userIds),
      Query.limit(5000),
    ])
    for (const o of ordersResult.documents) {
      orderCountMap[o.userId] = (orderCountMap[o.userId] ?? 0) + 1
    }
  }

  const result = appwriteUsers.users.map(u => {
    const profile = profileMap[u.$id]
    return {
      id: u.$id,
      email: u.email,
      name: u.name,
      phone: profile?.phone ?? '',
      role: profile?.role ?? 'CUSTOMER',
      isActive: profile?.isActive ?? true,
      avatarUrl: profile?.avatarUrl ?? '',
      orderCount: orderCountMap[u.$id] ?? 0,
      createdAt: u.$createdAt,
      labels: u.labels ?? [],
    }
  })

  return res.json({ users: result, total: appwriteUsers.total })
}
