import { query } from '../_db.js'
import { parseBody, sendMethodNotAllowed } from '../_shop.js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST'])
    return
  }

  try {
    const body = parseBody(req)
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid user id' })
      return
    }

    const allowed: Record<string, string> = {
      name: 'name',
      address: 'address',
      phone: 'phone',
      zip: 'zip',
      city: 'city',
      email: 'email',
    }

    const updates: string[] = []
    const params: any[] = []

    for (const key of Object.keys(allowed)) {
      if (body[key] !== undefined) {
        updates.push(`${allowed[key]} = ?`)
        params.push(String(body[key]))
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' })
      return
    }

    params.push(id)

    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)

    const rows: any = await query(
      'SELECT id, email, name, address, phone, zip, city FROM users WHERE id = ? LIMIT 1',
      [id]
    )
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = rows[0]
    res.status(200).json(user)
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update user' })
  }
}
