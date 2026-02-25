import {
  ensureSchemaAndSeed,
  listOrders,
  createOrder,
  updateOrderStatus,
  parseBody,
} from '../lib/_shop.js'
import { requireMethod, handleError } from '../utils.js'

export default async function handler(req: any, res: any) {
  if (!requireMethod(req, res, ['GET', 'POST', 'PATCH'])) return
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
    const body = parseBody(req)
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid order id')
    const updated = await updateOrderStatus(id, String(body.status))
    res.status(200).json(updated)
  } catch (error) {
    handleError(res, error)
  }
}
