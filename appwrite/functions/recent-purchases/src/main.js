import { Client, Databases, Query } from 'node-appwrite'

export default async ({ req, res }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const ordersResult = await db.listDocuments(DB, 'orders', [
    Query.equal('status', 'PAID'),
    Query.greaterThan('paidAt', sevenDaysAgo),
    Query.orderDesc('paidAt'),
    Query.limit(20),
  ])

  const SAMPLE = [
    { customerName: 'Maria S.', totalAmount: 29.9, paidAt: new Date().toISOString() },
    { customerName: 'Joao P.', totalAmount: 49.9, paidAt: new Date().toISOString() },
    { customerName: 'Ana C.', totalAmount: 19.9, paidAt: new Date().toISOString() },
  ]

  const data = ordersResult.documents.length >= 3
    ? ordersResult.documents.map(o => ({
        customerName: o.customerName.split(' ')[0] + ' ' + (o.customerName.split(' ')[1]?.[0] ?? '') + '.',
        totalAmount: o.totalAmount,
        paidAt: o.paidAt,
      }))
    : SAMPLE

  return res.json({ purchases: data })
}
