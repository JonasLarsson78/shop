import {
  ensureSchemaAndSeed,
  getShopSnapshot,
  sendMethodNotAllowed,
} from './_shop'

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
    // Log and expose stack in non-production to help debugging
    console.error('Bootstrap error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to bootstrap shop data'
    const stack =
      error instanceof Error && process.env.NODE_ENV !== 'production'
        ? error.stack
        : undefined
    res.status(500).json({ error: message, stack })
  }
}
