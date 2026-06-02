import { Client, Databases, Query } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // Parse body once (Appwrite executions always arrive as POST, so the
  // PATCH "method" is signalled via body._method)
  let parsedBody = {}
  if (req.body) {
    try { parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body } catch {}
  }

  const isPatch = req.method === 'PATCH' || parsedBody._method === 'PATCH'

  if (isPatch) {
    const { userId, phone } = parsedBody
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

  // GET: list users — driven by the `profiles` collection so the list can be
  // ordered by the REAL signup date (profile.createdAt, preserved from
  // Supabase), newest first. The auth user's $createdAt is only the migration
  // timestamp, so listing auth users would order everyone by migration time.
  const search = req.query?.search ?? parsedBody.search ?? ''
  const limit = Math.min(parseInt(req.query?.limit ?? parsedBody.limit ?? '50'), 100)
  const offset = parseInt(req.query?.offset ?? parsedBody.offset ?? '0')

  const profileQueries = [
    Query.orderDesc('createdAt'),
    Query.limit(limit),
    Query.offset(offset),
  ]
  if (search) profileQueries.push(Query.search('name', search))

  const profilesResult = await db.listDocuments(DB, 'profiles', profileQueries)
  const profiles = profilesResult.documents
  const userIds = profiles.map(p => p.userId)

  // Count orders per user (this page only)
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

  const result = profiles.map(p => ({
    id: p.userId,            // === profile.$id; the admin edits/toggles by this
    email: p.email,
    name: p.name,
    phone: p.phone ?? '',
    role: p.role ?? 'CUSTOMER',
    isActive: p.isActive ?? true,
    avatarUrl: p.avatarUrl ?? '',
    orderCount: orderCountMap[p.userId] ?? 0,
    createdAt: p.createdAt ?? p.$createdAt,
    labels: [],
  }))

  return res.json({ users: result, total: profilesResult.total })
}
