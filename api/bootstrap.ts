import { ensureSchemaAndSeed, getShopSnapshot, sendMethodNotAllowed } from './_shop'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET', 'POST'])
    return
  }

  try {
    await ensureSchemaAndSeed()
    const snapshot = await getShopSnapshot()
    res.status(200).json(snapshot)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to bootstrap shop data' })
  }
}
