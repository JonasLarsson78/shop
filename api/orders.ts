import {
  ensureSchemaAndSeed,
  listOrders,
  createOrder,
  updateOrderStatus,
  parseBody,
  sendMethodNotAllowed,
} from './_shop.js'

export default async function handler(req: any, res: any) {
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    sendMethodNotAllowed(res, ['GET', 'POST', 'PATCH'])
    return
  }

  try {
    await ensureSchemaAndSeed()

    if (req.method === 'GET') {
      const orders = await listOrders()
      res.status(200).json(orders)
      return
    }

    if (req.method === 'POST') {
      const order = await createOrder(parseBody(req))
      res.status(201).json(order)
      return
    }

    // PATCH: update status; body must include id and status
    if (req.method === 'PATCH') {
      const body = parseBody(req)
      const id = Number(body.id)
      if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid order id')

      const updated = await updateOrderStatus(id, body)
      res.status(200).json(updated)
      return
    }
  } catch (error) {
    res
      .status(400)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle orders request',
      })
  }
}
