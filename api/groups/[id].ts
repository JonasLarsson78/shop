import { query } from '../_db.js'
import { parseBody } from '../_shop.js'

export default async function handler(req: any, res: any) {
  const id = Number(req.query.id || req.query?.id || req.url?.split('/').pop())
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid group id' })
    return
  }

  if (req.method === 'GET') {
    const rows = await query('SELECT id, name FROM `groups` WHERE id = ? LIMIT 1', [id])
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ error: 'Group not found' })
      return
    }
    res.status(200).json(rows[0])
    return
  }

  if (req.method === 'PUT') {
    const body = parseBody(req)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      res.status(400).json({ error: 'Invalid group name' })
      return
    }
    await query('UPDATE `groups` SET name = ? WHERE id = ?', [name, id])
    const rows = await query('SELECT id, name FROM `groups` WHERE id = ? LIMIT 1', [id])
    res.status(200).json(rows[0])
    return
  }

  res.setHeader('Allow', 'GET, PUT')
  res.status(405).json({ error: 'Method Not Allowed' })
}
