import {
  createProduct,
  ensureSchemaAndSeed,
  listProducts,
  parseBody,
} from '../lib/_shop.js'
import { requireMethod, handleError } from '../utils.js'

export default async function handler(req: any, res: any) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return
  try {
    await ensureSchemaAndSeed()
    if (req.method === 'GET') {
      const products = await listProducts()
      res.status(200).json(products)
      return
    }
    // POST = create product
    const product = await createProduct(parseBody(req))
    res.status(201).json(product)
  } catch (error) {
    handleError(res, error)
  }
}
