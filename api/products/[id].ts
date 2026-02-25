import {
  deleteProduct,
  ensureSchemaAndSeed,
  getQueryId,
  parseBody,
  sendMethodNotAllowed,
  updateProduct,
} from '../_shop.js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    sendMethodNotAllowed(res, ['PUT', 'DELETE'])
    return
  }

  const productId = getQueryId(req)

  if (!productId) {
    res.status(400).json({ error: 'Missing product id' })
    return
  }

  try {
    await ensureSchemaAndSeed()

    if (req.method === 'DELETE') {
      await deleteProduct(productId)
      res.status(200).json({ ok: true })
      return
    }

    const product = await updateProduct(productId, parseBody(req))
    res.status(200).json(product)
  } catch (error) {
    res
      .status(400)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle product request',
      })
  }
}
