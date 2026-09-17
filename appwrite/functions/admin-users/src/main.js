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
  const role = req.query?.role ?? parsedBody.role ?? ''
  const status = req.query?.status ?? parsedBody.status ?? ''
  const limit = Math.min(parseInt(req.query?.limit ?? parsedBody.limit ?? '50'), 100)
  const offset = parseInt(req.query?.offset ?? parsedBody.offset ?? '0')

  const profileQueries = [
    Query.orderDesc('createdAt'),
    Query.limit(limit),
    Query.offset(offset),
  ]

  if (role) {
    profileQueries.push(Query.equal('role', role))
  }
  if (status === 'active') {
    profileQueries.push(Query.equal('isActive', true))
  } else if (status === 'inactive') {
    profileQueries.push(Query.equal('isActive', false))
  } else if (status === 'phone') {
    profileQueries.push(Query.isNotNull('phone'))
    profileQueries.push(Query.notEqual('phone', ''))
  } else if (status === 'today') {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    profileQueries.push(Query.greaterThanEqual('createdAt', todayStart.toISOString()))
  }

  if (search) {
    if (search.includes('@')) {
      profileQueries.push(Query.equal('email', search.trim()))
    } else {
      profileQueries.push(Query.startsWith('name', search.trim()))
    }
  }

  let profilesResult
  try {
    profilesResult = await db.listDocuments(DB, 'profiles', profileQueries)
  } catch (err) {
    log('Failed listDocuments with filters, falling back to basic list: ' + err.message)
    profilesResult = await db.listDocuments(DB, 'profiles', [
      Query.orderDesc('createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ])
  }
  const profiles = profilesResult.documents

  // Count orders per user (matching by userId, customerEmail, or guestPhone)
  let orderCountMap = {}
  if (profiles.length > 0) {
    try {
      const ordersResult = await db.listDocuments(DB, 'orders', [
        Query.limit(5000),
        Query.select(['$id', 'userId', 'customerEmail', 'guestPhone']),
      ])
      for (const p of profiles) {
        const pId = p.userId || p.$id
        const pEmail = p.email ? String(p.email).toLowerCase().trim() : null
        const pPhone = p.phone ? String(p.phone).replace(/\D/g, '') : null

        let count = 0
        for (const o of ordersResult.documents) {
          const oUserId = o.userId
          const oEmail = o.customerEmail ? String(o.customerEmail).toLowerCase().trim() : null
          const oPhone = o.guestPhone ? String(o.guestPhone).replace(/\D/g, '') : null

          if (
            (pId && oUserId && pId === oUserId) ||
            (pEmail && oEmail && pEmail === oEmail) ||
            (pPhone && oPhone && pPhone === oPhone)
          ) {
            count++
          }
        }
        orderCountMap[pId] = count
      }
    } catch (orderErr) {
      log('Failed to fetch order counts: ' + orderErr.message)
    }
  }

  const result = profiles.map(p => {
    const pId = p.userId || p.$id
    const displayName = (p.name && String(p.name).trim())
      ? String(p.name).trim()
      : (p.email ? String(p.email) : (p.phone ? `Cliente ${p.phone}` : 'Cliente Compra Rápida'))

    return {
      id: pId,
      email: p.email ?? '',
      name: displayName,
      phone: p.phone ?? '',
      role: p.role ?? 'CUSTOMER',
      isActive: p.isActive ?? true,
      avatarUrl: p.avatarUrl ?? '',
      orderCount: orderCountMap[pId] ?? 0,
      createdAt: p.createdAt ?? p.$createdAt,
      labels: [],
    }
  })

  return res.json({ users: result, total: profilesResult.total })
}

