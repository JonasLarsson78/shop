import { query } from '../lib/_db.js'
import { parseBody, sendMethodNotAllowed } from '../lib/_shop.js'
import crypto from 'crypto'

export default async function handler(req: any, res: any) {
  // CORS headers
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  if (req.method === 'OPTIONS') {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    }
    res.status(204).json({})
    return
  }

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
    const address = typeof body.address === 'string' ? body.address.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const zip = typeof body.zip === 'string' ? body.zip.trim() : ''
    const city = typeof body.city === 'string' ? body.city.trim() : ''
    if (!email || !password || password.length < 6) {
      res.status(400).json({ error: 'Invalid email or password (min 6 chars)' })
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
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to register',
    })
  }
}
