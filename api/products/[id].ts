import {
  ensureSchemaAndSeed,
  parseBody,
  updateProduct,
  deleteProduct,
} from '../lib/_shop.js'
import { requireMethod, handleError } from '../utils.js'

export default async function handler(req: any, res: any) {
  if (!requireMethod(req, res, ['PUT', 'DELETE'])) return
  const id = Number(req.query.id || req.query?.id || req.url?.split('/').pop())
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid product id' })
    return
  }
  try {
    await ensureSchemaAndSeed()
    if (req.method === 'DELETE') {
      await deleteProduct(id)
      res.status(200).json({ ok: true })
      return
    }
    // PUT = update product
    const updated = await updateProduct(id, parseBody(req))
    res.status(200).json(updated)
  } catch (error) {
    handleError(res, error)
  }
}
