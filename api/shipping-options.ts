import { query } from './_db.js'
import { sendMethodNotAllowed, parseBody } from './_shop.js'
import type { ResultSetHeader } from 'mysql2'

export type ShippingOption = {
  id: number
  name: string
  price: number
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
    return
  }

  try {
    if (req.method === 'GET') {
      const options = await query<ShippingOption[]>(
        'SELECT id, name, price FROM shipping_options ORDER BY id ASC'
      )
      res.status(200).json(options)
      return
    }

    if (req.method === 'POST') {
      const { name, price } = parseBody(req)
      if (!name || typeof price !== 'number' || price < 0) {
        res.status(400).json({ error: 'Invalid payload' })
        return
      }
      const result = await query<ResultSetHeader>(
        'INSERT INTO shipping_options (name, price) VALUES (?, ?)',
        [name, Math.floor(price)]
      )
      res
        .status(201)
        .json({ id: result.insertId, name, price: Math.floor(price) })
      return
    }

    if (req.method === 'PUT') {
      const { id, name, price } = parseBody(req)
      if (!id || !name || typeof price !== 'number' || price < 0) {
        res.status(400).json({ error: 'Invalid payload' })
        return
      }
      await query(
        'UPDATE shipping_options SET name = ?, price = ? WHERE id = ?',
        [name, Math.floor(price), id]
      )
      res.status(200).json({ id, name, price: Math.floor(price) })
      return
    }

    if (req.method === 'DELETE') {
      const { id } = parseBody(req)
      if (!id) {
        res.status(400).json({ error: 'Missing id' })
        return
      }
      await query('DELETE FROM shipping_options WHERE id = ?', [id])
      res.status(204).end()
      return
    }
  } catch (error) {
    res
      .status(500)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle shipping options',
      })
  }
}
