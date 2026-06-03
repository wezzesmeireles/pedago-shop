import { Client, Databases, Users, ID, Query, Permission, Role } from 'node-appwrite'
import crypto from 'crypto'

// Admin support toolbox. One function, several actions, all requiring an admin
// caller. Used by the admin "Suporte / Saúde das Entregas" page to diagnose and
// fix the delivery problems we used to fix by hand with scripts:
//   - health           : scan for broken deliveries (bounded to a recent window)
//   - fix              : repair what `health` found (which: tokens|perms|profiles|reconcile|all)
//   - reissue          : ensure tokens + permissions for ONE order, return its links
//   - customer-downloads: list a customer's downloads by email (for manual resend)
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
  const db = new Databases(client)
  const users = new Users(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // ── AuthZ: caller must be an admin ───────────────────────────────────────────
  const callerId = req.headers['x-appwrite-user-id']
  if (!callerId) return res.json({ error: 'unauthorized' }, 401)
  try {
    const caller = await users.get(callerId)
    if (!(caller.labels || []).includes('admin')) return res.json({ error: 'forbidden' }, 403)
  } catch {
    return res.json({ error: 'unauthorized' }, 401)
  }

  let body = {}
  try { body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {} } catch {}
  const action = body.action

  const ownerRead = (uid) => uid ? [Permission.read(Role.user(uid))] : undefined
  const hasUserRead = (doc, uid) => (doc.$permissions || []).includes(`read("user:${uid}")`)
  const tokenExpiry = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 30); return d.toISOString() }

  async function listAll(col, queries = []) {
    const out = []; let cursor = null
    while (true) {
      const q = [...queries, Query.limit(100)]
      if (cursor) q.push(Query.cursorAfter(cursor))
      const r = await db.listDocuments(DB, col, q)
      out.push(...r.documents)
      if (r.documents.length < 100) break
      cursor = r.documents[r.documents.length - 1].$id
    }
    return out
  }
  // batch IN-query by chunks of 100
  async function listByIds(col, field, ids, extra = []) {
    const out = []
    for (let i = 0; i < ids.length; i += 100) {
      const r = await db.listDocuments(DB, col, [Query.equal(field, ids.slice(i, i + 100)), ...extra, Query.limit(500)])
      out.push(...r.documents)
    }
    return out
  }

  // MP token (for the reconcile check) — same source as reconcile-orders
  async function mpToken() {
    let t = process.env.MERCADO_PAGO_ACCESS_TOKEN
    try { const c = await db.getDocument(DB, 'site_config', 'global'); const sc = JSON.parse(c.value); if (sc.mercadoPagoAccessToken) t = sc.mercadoPagoAccessToken } catch {}
    return t
  }

  const days = Math.min(Math.max(parseInt(body.days ?? '45'), 1), 365)
  const since = new Date(Date.now() - days * 864e5).toISOString()

  // ── SCAN (shared by health + fix) ────────────────────────────────────────────
  async function scan() {
    const orders = await listAll('orders', [Query.greaterThan('createdAt', since), Query.orderDesc('createdAt')])
    const orderIds = orders.map(o => o.$id)
    const items = orderIds.length ? await listByIds('order_items', 'orderId', orderIds) : []
    const tokens = orderIds.length ? await listByIds('download_tokens', 'orderId', orderIds) : []

    const itemsByOrder = {}; for (const it of items) (itemsByOrder[it.orderId] ??= []).push(it)
    const tokensByOrder = {}; for (const t of tokens) (tokensByOrder[t.orderId] ??= []).push(t)
    const orderUser = {}; for (const o of orders) if (o.userId) orderUser[o.$id] = o.userId

    // 1) PAID orders whose tokens < items (broken delivery)
    const paidWithoutTokens = orders.filter(o => o.status === 'PAID'
      && (tokensByOrder[o.$id]?.length ?? 0) < (itemsByOrder[o.$id]?.length ?? 0))
      .map(o => ({ orderId: o.$id, orderNumber: o.orderNumber, email: o.customerEmail,
                   items: itemsByOrder[o.$id]?.length ?? 0, tokens: tokensByOrder[o.$id]?.length ?? 0 }))

    // 2) docs missing owner read permission
    const ordersNoPerm = orders.filter(o => o.userId && !hasUserRead(o, o.userId))
    const itemsNoPerm = items.filter(it => orderUser[it.orderId] && !hasUserRead(it, orderUser[it.orderId]))
    const tokensNoPerm = tokens.filter(t => orderUser[t.orderId] && !hasUserRead(t, orderUser[t.orderId]))

    // 3) awaiting-payment orders that MP already approved
    const awaiting = orders.filter(o => o.status === 'AWAITING_PAYMENT' && o.mpPaymentId)
    const approvedButAwaiting = []
    if (awaiting.length) {
      const tk = await mpToken()
      if (tk) {
        for (const o of awaiting) {
          try {
            const r = await fetch(`https://api.mercadopago.com/v1/payments/${o.mpPaymentId}`, { headers: { Authorization: `Bearer ${tk}` } })
            const p = await r.json()
            if (p.status === 'approved') approvedButAwaiting.push({ orderId: o.$id, orderNumber: o.orderNumber, email: o.customerEmail })
          } catch {}
        }
      }
    }

    // 4) recent users without a profile
    const recentUsers = await users.list([Query.orderDesc('$createdAt'), Query.limit(100)])
    const recentIds = recentUsers.users.map(u => u.$id)
    const profs = recentIds.length ? await listByIds('profiles', 'userId', recentIds) : []
    const haveProfile = new Set(profs.map(p => p.userId))
    const usersWithoutProfile = recentUsers.users.filter(u => !haveProfile.has(u.$id))
      .map(u => ({ userId: u.$id, email: u.email, name: u.name }))

    return { orders, items, tokens, itemsByOrder, tokensByOrder, orderUser,
             paidWithoutTokens, ordersNoPerm, itemsNoPerm, tokensNoPerm,
             approvedButAwaiting, usersWithoutProfile }
  }

  try {
    // ── HEALTH ────────────────────────────────────────────────────────────────
    if (action === 'health') {
      const s = await scan()
      return res.json({
        windowDays: days,
        paidWithoutTokens: s.paidWithoutTokens,
        missingOwnerPerms: { orders: s.ordersNoPerm.length, items: s.itemsNoPerm.length, tokens: s.tokensNoPerm.length },
        approvedButAwaiting: s.approvedButAwaiting,
        usersWithoutProfile: s.usersWithoutProfile,
        totalIssues: s.paidWithoutTokens.length + s.ordersNoPerm.length + s.itemsNoPerm.length
                   + s.tokensNoPerm.length + s.approvedButAwaiting.length + s.usersWithoutProfile.length,
      })
    }

    // ── FIX ─────────────────────────────────────────────────────────────────────
    if (action === 'fix') {
      const which = body.which ?? 'all'
      const want = (k) => which === 'all' || which === k
      const s = await scan()
      const result = { tokensCreated: 0, permsFixed: 0, profilesCreated: 0, reconciled: 0 }

      // tokens for paid-without-tokens
      if (want('tokens')) {
        for (const p of s.paidWithoutTokens) {
          const its = s.itemsByOrder[p.orderId] ?? []
          const uid = s.orderUser[p.orderId]
          for (const it of its) {
            const existing = await db.listDocuments(DB, 'download_tokens', [Query.equal('orderItemId', it.$id), Query.limit(1)])
            if (existing.total === 0) {
              await db.createDocument(DB, 'download_tokens', ID.unique(), {
                token: crypto.randomUUID(), orderId: p.orderId, orderItemId: it.$id,
                maxDownloads: 5, downloadCount: 0, expiresAt: tokenExpiry(), deliveryLink: it.deliveryLink ?? null,
              }, ownerRead(uid))
              result.tokensCreated++
            }
          }
        }
      }

      // owner-read perms
      if (want('perms')) {
        for (const o of s.ordersNoPerm) { await db.updateDocument(DB, 'orders', o.$id, {}, ownerRead(s.orderUser[o.$id])); result.permsFixed++ }
        for (const it of s.itemsNoPerm) { await db.updateDocument(DB, 'order_items', it.$id, {}, ownerRead(s.orderUser[it.orderId])); result.permsFixed++ }
        for (const t of s.tokensNoPerm) { await db.updateDocument(DB, 'download_tokens', t.$id, {}, ownerRead(s.orderUser[t.orderId])); result.permsFixed++ }
      }

      // missing profiles
      if (want('profiles')) {
        for (const u of s.usersWithoutProfile) {
          try {
            const full = await users.get(u.userId)
            await db.createDocument(DB, 'profiles', u.userId, {
              userId: u.userId, name: full.name || full.email?.split('@')[0] || 'Usuário',
              email: full.email ?? '', phone: full.phone ?? '', role: 'CUSTOMER', isActive: true,
              createdAt: full.$createdAt, updatedAt: new Date().toISOString(),
            })
            result.profilesCreated++
          } catch (e) { if (e.code !== 409) error('profile create: ' + e.message) }
        }
      }

      // reconcile approved-but-awaiting
      if (want('reconcile')) {
        const now = new Date().toISOString()
        for (const a of s.approvedButAwaiting) {
          const o = s.orders.find(x => x.$id === a.orderId)
          await db.updateDocument(DB, 'orders', a.orderId, { status: 'PAID', mpStatus: 'approved', paidAt: now, updatedAt: now })
          const its = s.itemsByOrder[a.orderId] ?? []
          for (const it of its) {
            const existing = await db.listDocuments(DB, 'download_tokens', [Query.equal('orderItemId', it.$id), Query.limit(1)])
            if (existing.total === 0) {
              await db.createDocument(DB, 'download_tokens', ID.unique(), {
                token: crypto.randomUUID(), orderId: a.orderId, orderItemId: it.$id,
                maxDownloads: 5, downloadCount: 0, expiresAt: tokenExpiry(), deliveryLink: it.deliveryLink ?? null,
              }, ownerRead(o?.userId))
            }
          }
          result.reconciled++
        }
      }

      return res.json({ ok: true, ...result })
    }

    // ── REISSUE (one order) ──────────────────────────────────────────────────────
    if (action === 'reissue') {
      const orderId = body.orderId
      if (!orderId) return res.json({ error: 'orderId required' }, 400)
      const order = await db.getDocument(DB, 'orders', orderId)
      const uid = order.userId
      // ensure order has owner read
      if (uid && !hasUserRead(order, uid)) await db.updateDocument(DB, 'orders', orderId, {}, ownerRead(uid))
      const items = await db.listDocuments(DB, 'order_items', [Query.equal('orderId', orderId), Query.limit(100)])
      const out = []
      for (const it of items.documents) {
        if (uid && !hasUserRead(it, uid)) await db.updateDocument(DB, 'order_items', it.$id, {}, ownerRead(uid))
        let toks = await db.listDocuments(DB, 'download_tokens', [Query.equal('orderItemId', it.$id), Query.limit(5)])
        if (toks.total === 0) {
          await db.createDocument(DB, 'download_tokens', ID.unique(), {
            token: crypto.randomUUID(), orderId, orderItemId: it.$id,
            maxDownloads: 5, downloadCount: 0, expiresAt: tokenExpiry(), deliveryLink: it.deliveryLink ?? null,
          }, ownerRead(uid))
          toks = await db.listDocuments(DB, 'download_tokens', [Query.equal('orderItemId', it.$id), Query.limit(5)])
        } else {
          for (const t of toks.documents) if (uid && !hasUserRead(t, uid)) await db.updateDocument(DB, 'download_tokens', t.$id, {}, ownerRead(uid))
        }
        let fileId = null
        try { const p = await db.getDocument(DB, 'products', it.productId); if (p.fileKey) fileId = String(p.fileKey).replace(/\.[^.]+$/, '') } catch {}
        out.push({ productName: it.productName, token: toks.documents[0]?.token ?? null,
                   deliveryLink: it.deliveryLink ?? null, fileId })
      }
      return res.json({ ok: true, orderNumber: order.orderNumber, customerEmail: order.customerEmail, items: out })
    }

    // ── CUSTOMER DOWNLOADS (by email) ────────────────────────────────────────────
    if (action === 'customer-downloads') {
      const email = (body.email ?? '').trim().toLowerCase()
      if (!email) return res.json({ error: 'email required' }, 400)
      const found = await users.list([Query.equal('email', email), Query.limit(10)])
      if (!found.total) return res.json({ ok: true, user: null, downloads: [] })
      const ids = found.users.map(u => u.$id)
      const orders = await listByIds('orders', 'userId', ids, [Query.equal('status', 'PAID')])
      const downloads = []
      for (const o of orders) {
        const items = await db.listDocuments(DB, 'order_items', [Query.equal('orderId', o.$id), Query.limit(100)])
        for (const it of items.documents) {
          const toks = await db.listDocuments(DB, 'download_tokens', [Query.equal('orderItemId', it.$id), Query.isNull('revokedAt'), Query.limit(1)])
          let fileId = null
          try { const p = await db.getDocument(DB, 'products', it.productId); if (p.fileKey) fileId = String(p.fileKey).replace(/\.[^.]+$/, '') } catch {}
          downloads.push({ orderNumber: o.orderNumber, productName: it.productName,
                           token: toks.documents[0]?.token ?? null, deliveryLink: it.deliveryLink ?? null, fileId })
        }
      }
      return res.json({ ok: true, user: { id: ids[0], name: found.users[0].name, email: found.users[0].email }, downloads })
    }

    return res.json({ error: 'unknown action' }, 400)
  } catch (e) {
    error('admin-ops ' + action + ': ' + e.message)
    return res.json({ error: e.message }, 500)
  }
}
