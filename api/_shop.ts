import { query } from './_db'
import { DEFAULT_PRODUCT_IMAGE } from './_defaults'
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
  shippingCost: number
  freeShippingThreshold: number
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

export const sendMethodNotAllowed = (res: VercelResponse, allowed: string[]) => {
  res.status(405).json({ error: `Method not allowed. Allowed: ${allowed.join(', ')}` })
}

const normalizeGroupId = async (groupId: unknown) => {
  if (groupId === null || groupId === undefined || groupId === '') {
    return null
  }

  const normalizedGroupId = Number(groupId)

  if (!Number.isInteger(normalizedGroupId) || normalizedGroupId <= 0) {
    return null
  }

  const rows = await query<Array<{ id: number }>>('SELECT id FROM `groups` WHERE id = ? LIMIT 1', [normalizedGroupId])
  return rows.length > 0 ? normalizedGroupId : null
}

let schemaReady = false
let schemaInitPromise: Promise<void> | null = null

const numericSqlTypes = new Set(['tinyint', 'smallint', 'mediumint', 'int', 'bigint'])

const resetLegacyStringIdTablesIfNeeded = async () => {
  const columns = await query<Array<{ tableName: string; columnName: string; dataType: string }>>(`
    SELECT
      TABLE_NAME AS tableName,
      COLUMN_NAME AS columnName,
      DATA_TYPE AS dataType
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND (
        (TABLE_NAME = 'products' AND COLUMN_NAME IN ('id', 'group_id'))
        OR (TABLE_NAME = 'groups' AND COLUMN_NAME = 'id')
      )
  `)

  if (columns.length === 0) {
    return
  }

  const hasLegacyType = columns.some((column) => !numericSqlTypes.has(column.dataType.toLowerCase()))

  if (!hasLegacyType) {
    return
  }

  await query('SET FOREIGN_KEY_CHECKS = 0')
  await query('DROP TABLE IF EXISTS products')
  await query('DROP TABLE IF EXISTS `groups`')
  await query('SET FOREIGN_KEY_CHECKS = 1')
}

const ensureSchemaAndSeedInternal = async () => {
  await resetLegacyStringIdTablesIfNeeded()

  await query(`
    CREATE TABLE IF NOT EXISTS \`groups\` (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      description TEXT NOT NULL,
      price INT NOT NULL,
      image_url TEXT NOT NULL,
      group_id INT UNSIGNED NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_products_group FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      id TINYINT PRIMARY KEY,
      store_name VARCHAR(160) NOT NULL,
      shipping_cost INT NOT NULL,
      free_shipping_threshold INT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

}

export const ensureSchemaAndSeed = async () => {
  if (schemaReady) {
    return
  }

  if (!schemaInitPromise) {
    schemaInitPromise = ensureSchemaAndSeedInternal()
      .then(() => {
        schemaReady = true
      })
      .catch((error) => {
        schemaInitPromise = null
        throw error
      })
  }

  await schemaInitPromise
}

export const listProducts = async (): Promise<Product[]> => {
  const rows = await query<Array<{ id: number; name: string; description: string; price: number; imageUrl: string; groupId: number | null }>>(`
    SELECT id, name, description, price, image_url AS imageUrl, group_id AS groupId
    FROM products
    ORDER BY created_at ASC
  `)

  return rows
}

export const createProduct = async (rawPayload: unknown): Promise<Product> => {
  const payload = asRecord(rawPayload)
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const description = typeof payload.description === 'string' ? payload.description.trim() : ''
  const price = Number(payload.price)
  const imageUrl = typeof payload.imageUrl === 'string' && payload.imageUrl.trim() ? payload.imageUrl.trim() : DEFAULT_PRODUCT_IMAGE

  if (!name || !description || !Number.isFinite(price) || price < 0) {
    throw new Error('Invalid product payload')
  }

  const groupId = await normalizeGroupId(payload.groupId)

  const result = await query<ResultSetHeader>(
    'INSERT INTO products (name, description, price, image_url, group_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, Math.floor(price), imageUrl, groupId],
  )

  const id = result.insertId

  return {
    id,
    name,
    description,
    price: Math.floor(price),
    imageUrl,
    groupId,
  }
}

export const updateProduct = async (productId: number, rawPayload: unknown): Promise<Product> => {
  const payload = asRecord(rawPayload)
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const description = typeof payload.description === 'string' ? payload.description.trim() : ''
  const price = Number(payload.price)
  const imageUrl = typeof payload.imageUrl === 'string' && payload.imageUrl.trim() ? payload.imageUrl.trim() : DEFAULT_PRODUCT_IMAGE

  if (!name || !description || !Number.isFinite(price) || price < 0) {
    throw new Error('Invalid product payload')
  }

  const groupId = await normalizeGroupId(payload.groupId)

  await query(
    'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, group_id = ? WHERE id = ?',
    [name, description, Math.floor(price), imageUrl, groupId, productId],
  )

  return {
    id: productId,
    name,
    description,
    price: Math.floor(price),
    imageUrl,
    groupId,
  }
}

export const deleteProduct = async (productId: number) => {
  await query('DELETE FROM products WHERE id = ?', [productId])
}

export const listGroups = async (): Promise<ProductGroup[]> => {
  const rows = await query<Array<{ id: number; name: string }>>('SELECT id, name FROM `groups` ORDER BY created_at ASC')
  return rows
}

export const createGroup = async (rawPayload: unknown): Promise<ProductGroup> => {
  const payload = asRecord(rawPayload)
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''

  if (!name) {
    throw new Error('Invalid group payload')
  }

  const result = await query<ResultSetHeader>('INSERT INTO `groups` (name) VALUES (?)', [name])
  const id = result.insertId

  return { id, name }
}

export const updateGroup = async (groupId: number, rawPayload: unknown): Promise<ProductGroup> => {
  const payload = asRecord(rawPayload)
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''

  if (!name) {
    throw new Error('Invalid group payload')
  }

  await query('UPDATE `groups` SET name = ? WHERE id = ?', [name, groupId])
  return { id: groupId, name }
}

export const deleteGroup = async (groupId: number) => {
  await query('DELETE FROM `groups` WHERE id = ?', [groupId])
}

export const getSettings = async (): Promise<ShopSettings | null> => {
  const rows = await query<Array<{ storeName: string; shippingCost: number; freeShippingThreshold: number }>>(`
    SELECT store_name AS storeName, shipping_cost AS shippingCost, free_shipping_threshold AS freeShippingThreshold
    FROM settings
    WHERE id = 1
    LIMIT 1
  `)

  if (!rows[0]) {
    return null
  }

  return rows[0]
}

export const updateSettings = async (rawPayload: unknown): Promise<ShopSettings> => {
  const payload = asRecord(rawPayload)
  const currentSettings = await getSettings()

  const storeName = typeof payload.storeName === 'string' && payload.storeName.trim() ? payload.storeName.trim() : (currentSettings?.storeName ?? '')
  const shippingCost = Number.isFinite(Number(payload.shippingCost)) ? Math.max(0, Math.floor(Number(payload.shippingCost))) : (currentSettings?.shippingCost ?? 0)
  const freeShippingThreshold = Number.isFinite(Number(payload.freeShippingThreshold))
    ? Math.max(0, Math.floor(Number(payload.freeShippingThreshold)))
    : (currentSettings?.freeShippingThreshold ?? 0)

  await query(
    `INSERT INTO settings (id, store_name, shipping_cost, free_shipping_threshold)
     VALUES (1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       store_name = VALUES(store_name),
       shipping_cost = VALUES(shipping_cost),
       free_shipping_threshold = VALUES(free_shipping_threshold)`,
    [storeName, shippingCost, freeShippingThreshold],
  )

  return {
    storeName,
    shippingCost,
    freeShippingThreshold,
  }
}

export const getShopSnapshot = async () => {
  const [products, groups, settings] = await Promise.all([listProducts(), listGroups(), getSettings()])

  return {
    products,
    groups,
    settings,
  }
}
