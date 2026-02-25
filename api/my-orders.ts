import { ensureSchemaAndSeed, listOrders } from './_shop.js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  try {
    await ensureSchemaAndSeed()
    const { userId, email } = req.query
    const filters: any = {}
    if (userId) filters.userId = Number(userId)
    if (email) filters.email = email
    const orders = await listOrders(filters)
    res.status(200).json(Array.isArray(orders) ? orders : [])
  } catch (error) {
    res
      .status(500)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user orders',
      })
  }
}
