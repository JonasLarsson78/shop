// --- SCAFFOLDED FUNCTIONS TO FIX IMPORT ERRORS ---
// These are placeholders. Implement logic as needed.

export const ensureSchemaAndSeed = async () => {
  // Example: create tables if not exist and seed with defaults
  await query(
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      description TEXT,
      price DECIMAL(10,2),
      imageUrl VARCHAR(255),
      groupId INT
    )`
  )
  // Add imageUrl column if missing
  try {
    const cols = await query<any[]>(
      "SHOW COLUMNS FROM products LIKE 'imageUrl'"
    )
    if (!Array.isArray(cols) || cols.length === 0) {
      await query('ALTER TABLE products ADD COLUMN imageUrl VARCHAR(255)')
    }
  } catch (err) {
    // ignore - best effort migration
  }

  // Add userId column to orders if missing
  try {
    const cols2 = await query<any[]>("SHOW COLUMNS FROM orders LIKE 'userId'")
    if (!Array.isArray(cols2) || cols2.length === 0) {
      await query('ALTER TABLE orders ADD COLUMN userId INT')
    }
  } catch (err) {
    // ignore - best effort migration
  }
  // Ensure `groups` table exists; the app uses this table exclusively
  await query(
    `CREATE TABLE IF NOT EXISTS \`groups\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  )
  // If an old `product_groups` table exists, copy names into `groups` (safe, no id-preserve)
  try {
    const tbl = await query<any[]>("SHOW TABLES LIKE 'product_groups'")
    if (Array.isArray(tbl) && tbl.length > 0) {
      const cntRows = await query<any[]>('SELECT COUNT(*) AS cnt FROM `groups`')
      const cnt = Array.isArray(cntRows) && cntRows[0] ? Number(cntRows[0].cnt || 0) : 0
      if (cnt === 0) {
        await query(`INSERT INTO \`groups\` (name) SELECT DISTINCT name FROM product_groups WHERE name NOT IN (SELECT name FROM \`groups\`)`)
      }
    }
  } catch (err) {
    // ignore migration failures - best-effort
  }
  await query(
    `CREATE TABLE IF NOT EXISTS shop_settings (
      id INT PRIMARY KEY,
      storeName VARCHAR(255),
      subName VARCHAR(255),
      brandImageUrl VARCHAR(255),
      heroKicker VARCHAR(255),
      heroTitle VARCHAR(255),
      heroLead VARCHAR(255),
      heroPoint1 VARCHAR(255),
      heroPoint2 VARCHAR(255),
      heroPoint3 VARCHAR(255),
      shopHeroKicker VARCHAR(255),
      shopHeroTitle VARCHAR(255),
      shopHeroLead VARCHAR(255),
      cartHeroKicker VARCHAR(255),
      cartHeroTitle VARCHAR(255),
      cartHeroLead VARCHAR(255),
      checkoutHeroKicker VARCHAR(255),
      checkoutHeroTitle VARCHAR(255),
      checkoutHeroLead VARCHAR(255),
      shippingCost DECIMAL(10,2),
      freeShippingThreshold DECIMAL(10,2),
      vatPercent DECIMAL(5,2),
      themeMode VARCHAR(32),
      themeCustomAccentHex VARCHAR(16),
      themeCustomMutedHex VARCHAR(16),
      themeCustomDangerHex VARCHAR(16)
    )`
  )
  // Insert default settings if not exists
  await query(
    `INSERT IGNORE INTO shop_settings (id, storeName) VALUES (1, 'Demo Shop')`
  )
  return true
}

export const getSettings = async () => {
  const rows = await query<ShopSettings[]>(
    'SELECT * FROM shop_settings WHERE id = 1'
  )
  const row = rows[0] || {}
  // Normalize numeric and theme fields coming from DB (DECIMAL may be returned as string)
  const normalized: any = {
    ...row,
    shippingCost: row.shippingCost != null ? Number(row.shippingCost) : null,
    freeShippingThreshold:
      row.freeShippingThreshold != null
        ? Number(row.freeShippingThreshold)
        : null,
    vatPercent: row.vatPercent != null ? Number(row.vatPercent) : null,
  }
  const validModes = ['default', 'teal', 'rose', 'custom']
  normalized.themeMode =
    typeof normalized.themeMode === 'string' &&
    validModes.includes(normalized.themeMode)
      ? normalized.themeMode
      : null

  return normalized
}

export const updateSettings = async (settings: Partial<ShopSettings>) => {
  const keys = Object.keys(settings)
  if (!keys.length) return {}
  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  const values = keys.map((k) => (settings as any)[k])
  await query(`UPDATE shop_settings SET ${setClause} WHERE id = 1`, values)
  return getSettings()
}

export const updateProduct = async (id: number, data: Partial<Product>) => {
  const keys = Object.keys(data)
  if (!keys.length) return { id }
  const mapping: Record<string, string> = {
    imageUrl: 'image_url',
    groupId: 'group_id',
  }
  const cols = keys.map((k) => mapping[k] ?? k)
  const setClause = cols.map((c) => `${c} = ?`).join(', ')
  const values = keys.map((k) => (data as any)[k])
  await query(`UPDATE products SET ${setClause} WHERE id = ?`, [...values, id])
  const rows = await query<Product[]>(
    'SELECT id, name, description, price, image_url AS imageUrl, group_id AS groupId, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE id = ?',
    [id]
  )
  return rows[0] || { id }
}

export const deleteProduct = async (id: number) => {
  await query('DELETE FROM products WHERE id = ?', [id])
  return { id }
}

export const createProduct = async (data: Partial<Product>) => {
  const { name, description, price, imageUrl, groupId } = data
  const result = await query<ResultSetHeader>(
    'INSERT INTO products (name, description, price, image_url, group_id) VALUES (?, ?, ?, ?, ?)',
    [
      name,
      description,
      price,
      imageUrl || DEFAULT_PRODUCT_IMAGE,
      groupId || null,
    ]
  )
  const id = (result as any).insertId
  const rows = await query<Product[]>(
    'SELECT id, name, description, price, image_url AS imageUrl, group_id AS groupId, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE id = ?',
    [id]
  )
  return rows[0] || { id }
}

export const listProducts = async () => {
  return await query<Product[]>(
    'SELECT id, name, description, price, image_url AS imageUrl, group_id AS groupId, created_at AS createdAt, updated_at AS updatedAt FROM products'
  )
}

export const getShopSnapshot = async () => {
  const [settings, products, groups] = await Promise.all([
    getSettings(),
    listProducts(),
    // Use `groups` table only
    (async () => {
      try {
        const rows = await query<ProductGroup[]>(
          'SELECT id, name FROM `groups` ORDER BY id ASC'
        )
        return rows
      } catch {
        return []
      }
    })(),
  ])
  return { settings, products, groups }
}

export const getGroups = async (): Promise<ProductGroup[]> => {
  try {
    return await query<ProductGroup[]>(
      'SELECT id, name FROM `groups` ORDER BY id ASC'
    )
  } catch {
    return []
  }
}

export const listOrders = async (filters?: any) => {
  let sql =
    'SELECT id, customer_name AS customerName, user_id AS userId, email, address, phone, zip, city, items, total, shipping_option_id AS shippingOptionId, status, created_at AS createdAt, updated_at AS updatedAt FROM orders'
  const params: any[] = []
  if (filters && (filters.userId || filters.email)) {
    const conds: string[] = []
    if (filters.userId) {
      conds.push('user_id = ?')
      params.push(filters.userId)
    }
    if (filters.email) {
      conds.push('email = ?')
      params.push(filters.email)
    }
    sql += ' WHERE ' + conds.join(' AND ')
  }
  const rows = await query<any[]>(sql, params)
  return rows.map((r) => {
    if (r && typeof r.items === 'string') {
      try {
        r.items = JSON.parse(r.items)
      } catch {
        // leave as-is if parse fails
      }
    }
    return r
  })
}

export const createOrder = async (orderData: any) => {
  // Accept either top-level fields or customer object
  const userId = orderData.userId || orderData.user_id || null
  const email = orderData.email || orderData.customer?.email || null
  const items = orderData.items || []
  const total = orderData.total || 0
  const status = orderData.status || 'pending'
  const shippingOptionId =
    orderData.shippingOptionId || orderData.shipping_option_id || null

  const customerName =
    orderData.customer?.name ||
    orderData.customer_name ||
    orderData.customerName ||
    ''
  const address = orderData.customer?.address || orderData.address || ''
  const phone = orderData.customer?.phone || orderData.phone || ''
  const zip = orderData.customer?.zip || orderData.zip || ''
  const city = orderData.customer?.city || orderData.city || ''

  const result = await query<ResultSetHeader>(
    'INSERT INTO orders (customer_name, user_id, email, address, phone, zip, city, items, total, shipping_option_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      customerName,
      userId,
      email,
      address,
      phone,
      zip,
      city,
      JSON.stringify(items || []),
      total,
      shippingOptionId,
      status,
    ]
  )
  const id = (result as any).insertId
  const rows = await query<any[]>(
    'SELECT id, customer_name AS customerName, user_id AS userId, email, address, phone, zip, city, items, total, shipping_option_id AS shippingOptionId, status, created_at AS createdAt, updated_at AS updatedAt FROM orders WHERE id = ?',
    [id]
  )
  const row = rows[0]
  if (row && typeof row.items === 'string') {
    try {
      row.items = JSON.parse(row.items)
    } catch {}
  }
  return row || { id }
}

export const updateOrderStatus = async (orderId: number, status: string) => {
  await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])
  const rows = await query<any[]>(
    'SELECT id, customer_name AS customerName, user_id AS userId, email, address, phone, zip, city, items, total, shipping_option_id AS shippingOptionId, status, created_at AS createdAt, updated_at AS updatedAt FROM orders WHERE id = ?',
    [orderId]
  )
  const row = rows[0]
  if (row && typeof row.items === 'string') {
    try {
      row.items = JSON.parse(row.items)
    } catch {}
  }
  return row || { orderId, status }
}
import { query } from './_db.js'
import { DEFAULT_PRODUCT_IMAGE } from './_defaults.js'
import type { ResultSetHeader } from 'mysql2'

export type Product = {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  groupId: number | null
}

export type ProductGroup = {
  id: number
  name: string
}

export type ShopSettings = {
  storeName: string
  subName: string
  brandImageUrl: string
  heroKicker: string
  heroTitle: string
  heroLead: string
  heroPoint1: string
  heroPoint2: string
  heroPoint3: string
  shopHeroKicker: string
  shopHeroTitle: string
  shopHeroLead: string
  cartHeroKicker: string
  cartHeroTitle: string
  cartHeroLead: string
  checkoutHeroKicker: string
  checkoutHeroTitle: string
  checkoutHeroLead: string
  shippingCost: number
  freeShippingThreshold: number
  vatPercent: number
  themeMode: string
  themeCustomAccentHex: string
  themeCustomMutedHex: string
  themeCustomDangerHex: string
}

type VercelRequest = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[]>
}

type VercelResponse = {
  status: (statusCode: number) => VercelResponse
  json: (body: unknown) => void
}

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return value as Record<string, unknown>
}

export const parseBody = (req: VercelRequest) => {
  if (!req.body) {
    return {}
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  return asRecord(req.body)
}

export const getQueryId = (req: VercelRequest): number | null => {
  const rawId = req.query?.id
  const normalizeId = (value: string) => {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }

  if (typeof rawId === 'string') {
    return normalizeId(rawId)
  }

  if (Array.isArray(rawId) && rawId[0]) {
    return normalizeId(rawId[0])
  }

  return null
}

export const sendMethodNotAllowed = (
  res: VercelResponse,
  allowed: string[]
) => {
  res
    .status(405)
    .json({ error: `Method not allowed. Allowed: ${allowed.join(', ')}` })
}
