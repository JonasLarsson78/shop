import { ensureSchemaAndSeed, getShopSnapshot } from '../lib/_shop.js'
import { requireMethod, handleError } from '../../../api/lib/utils.js'

export default async function handler(req: any, res: any) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return

  try {
    await ensureSchemaAndSeed()
    const snapshot = await getShopSnapshot()
    res.status(200).json(snapshot)
  } catch (error) {
    console.error('Bootstrap error:', error)
    handleError(res, error)
  }
}
