import { query } from '../_db.js'
import { parseBody, sendMethodNotAllowed } from '../_shop.js'
import crypto from 'crypto'

const getAction = (req: any) => {
  const raw = req.url || ''
  const path = raw.split('?')[0]
  const parts = path.split('/').filter(Boolean)
  // expect /api/auth/<action>
  return parts[parts.length - 1] || ''
}

export default async function handler(req: any, res: any) {
  const action = getAction(req)

  if (action === 'login') {
    if (req.method !== 'POST') {
      sendMethodNotAllowed(res, ['POST'])
      return
    }

    try {
      const body = parseBody(req)
      const email =
        typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''

      if (!email || !password) {
        res.status(400).json({ error: 'Invalid credentials' })
        return
      }

      const rows: any = await query(
        'SELECT id, email, password_hash, salt, name, address, phone, zip, city FROM users WHERE email = ? LIMIT 1',
        [email]
      )

      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      const user = rows[0]
      const hash = crypto
        .pbkdf2Sync(password, user.salt, 310000, 32, 'sha256')
        .toString('hex')

      if (hash !== user.password_hash) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        address: user.address,
        phone: user.phone,
        zip: user.zip,
        city: user.city,
      })
    } catch (error) {
      res
        .status(500)
        .json({
          error: error instanceof Error ? error.message : 'Failed to login',
        })
    }

    return
  }

  if (action === 'register') {
    if (req.method !== 'POST') {
      sendMethodNotAllowed(res, ['POST'])
      return
    }

    try {
      const body = parseBody(req)
      const email =
        typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const address =
        typeof body.address === 'string' ? body.address.trim() : ''
      const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
      const zip = typeof body.zip === 'string' ? body.zip.trim() : ''
      const city = typeof body.city === 'string' ? body.city.trim() : ''

      if (!email || !password || password.length < 6) {
        res
          .status(400)
          .json({ error: 'Invalid email or password (min 6 chars)' })
        return
      }

      const existing = await query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      )
      if (Array.isArray(existing) && existing.length > 0) {
        res.status(409).json({ error: 'User already exists' })
        return
      }

      const salt = crypto.randomBytes(16).toString('hex')
      const hash = crypto
        .pbkdf2Sync(password, salt, 310000, 32, 'sha256')
        .toString('hex')

      const result: any = await query(
        'INSERT INTO users (email, password_hash, salt, name, address, phone, zip, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [email, hash, salt, name, address, phone, zip, city]
      )

      const id = result.insertId

      res.status(201).json({ id, email, name, address, phone, zip, city })
    } catch (error) {
      res
        .status(500)
        .json({
          error: error instanceof Error ? error.message : 'Failed to register',
        })
    }

    return
  }

  if (action === 'update') {
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

    return
  }

  res.status(404).json({ error: 'Not found' })
}
