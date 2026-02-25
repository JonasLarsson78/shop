import { query } from '../_db.js'
import { parseBody, sendMethodNotAllowed } from '../_shop.js'
import crypto from 'crypto'

export default async function handler(req: any, res: any) {
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

    // Simple response without tokens for now; frontend keeps minimal session in localStorage
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
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to login',
    })
  }
}
