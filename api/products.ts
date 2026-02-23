import {
  createProduct,
  ensureSchemaAndSeed,
  listProducts,
  parseBody,
  sendMethodNotAllowed,
} from './_shop'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendMethodNotAllowed(res, ['GET', 'POST'])
    return
  }

  try {
    await ensureSchemaAndSeed()

    if (req.method === 'GET') {
      const products = await listProducts()
      res.status(200).json(products)
      return
    }

    const product = await createProduct(parseBody(req))
    res.status(201).json(product)
  } catch (error) {
    res
      .status(400)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle products request',
      })
  }
}
