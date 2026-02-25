import { query } from '../lib/_db.js'
import { parseBody } from '../lib/_shop.js'
import { requireMethod, handleError } from '../../../api/lib/utils.js'
import type { ResultSetHeader } from 'mysql2'

const getIdFromReq = (req: any): number | null => {
  const q = req.query?.id || req.query?.Id
  if (q) {
    const n = Number(Array.isArray(q) ? q[0] : q)
    if (Number.isInteger(n) && n > 0) return n
  }
  try {
    const parts = (req.url || '').split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    const n = Number(last)
    if (Number.isInteger(n) && n > 0) return n
  } catch {}
  return null
}

export default async function handler(req: any, res: any) {
  if (!requireMethod(req, res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']))
    return

  const id = getIdFromReq(req)

  try {
    if (req.method === 'GET') {
      if (id) {
        const rows = await query<Array<{ id: number; name: string }>>(
          'SELECT id, name FROM `groups` WHERE id = ? LIMIT 1',
          [id]
        )
        if (!Array.isArray(rows) || rows.length === 0) {
          res.status(404).json({ error: 'Group not found' })
          return
        }
        res.status(200).json(rows[0])
        return
      }

      const rows = await query<Array<{ id: number; name: string }>>(
        'SELECT id, name FROM `groups` ORDER BY id ASC'
      )
      res.status(200).json(rows)
      return
    }

    if (req.method === 'POST') {
      const body = parseBody(req)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) {
        res.status(400).json({ error: 'Invalid group name' })
        return
      }
      const result = await query<ResultSetHeader>(
        'INSERT INTO `groups` (name) VALUES (?)',
        [name]
      )
      res.status(201).json({ id: result.insertId, name })
      return
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) {
        res.status(400).json({ error: 'Missing group id' })
        return
      }
      const body = parseBody(req)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) {
        res.status(400).json({ error: 'Invalid group name' })
        return
      }
      await query('UPDATE `groups` SET name = ? WHERE id = ?', [name, id])
      const rows = await query<Array<{ id: number; name: string }>>(
        'SELECT id, name FROM `groups` WHERE id = ? LIMIT 1',
        [id]
      )
      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(404).json({ error: 'Group not found after update' })
        return
      }
      res.status(200).json(rows[0])
      return
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'Missing group id' })
        return
      }
      await query('DELETE FROM `groups` WHERE id = ?', [id])
      res.status(204).end()
      return
    }
  } catch (error) {
    handleError(res, error)
  }
}
