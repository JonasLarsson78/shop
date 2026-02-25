import { ensureSchemaAndSeed, sendMethodNotAllowed } from '../lib/_shop.js'
import { query } from '../lib/_db.js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET'])
    return
  }

  try {
    await ensureSchemaAndSeed()

    const status =
      typeof req.query?.status === 'string' ? req.query.status : 'pending'

    const rows = await query<Array<{ c: number }>>(
      'SELECT COUNT(*) AS c FROM orders WHERE status = ?',
      [status]
    )
    const count = rows[0]?.c ?? 0

    res.status(200).json({ count })
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : 'Failed to get orders count',
    })
  }
}
