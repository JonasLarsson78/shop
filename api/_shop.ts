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

const normalizeGroupId = async (groupId: unknown) => {
  if (groupId === null || groupId === undefined || groupId === '') {
    return null
  }

  const normalizedGroupId = Number(groupId)

  if (!Number.isInteger(normalizedGroupId) || normalizedGroupId <= 0) {
    return null
  }

  const rows = await query<Array<{ id: number }>>(
    'SELECT id FROM `groups` WHERE id = ? LIMIT 1',
    [normalizedGroupId]
  )
  return rows.length > 0 ? normalizedGroupId : null
}

let schemaReady = false
let schemaInitPromise: Promise<void> | null = null

const numericSqlTypes = new Set([
  'tinyint',
  'smallint',
  'mediumint',
  'int',
  'bigint',
])

const resetLegacyStringIdTablesIfNeeded = async () => {
  const columns = await query<
    Array<{ tableName: string; columnName: string; dataType: string }>
  >(`
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

  const hasLegacyType = columns.some(
    (column) => !numericSqlTypes.has(column.dataType.toLowerCase())
  )

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

  // Ny tabell för shipping options
  await query(`
    CREATE TABLE IF NOT EXISTS shipping_options (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      price INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // Orders table
  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(160) NOT NULL,
      email VARCHAR(255) NOT NULL,
      user_id INT UNSIGNED NULL,
      address TEXT,
      phone VARCHAR(50) DEFAULT '',
      zip VARCHAR(30) DEFAULT '',
      city VARCHAR(120) DEFAULT '',
      items TEXT NOT NULL,
      total INT NOT NULL,
      shipping_option_id INT UNSIGNED NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // Users for simple auth
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      salt VARCHAR(255) NOT NULL,
      name VARCHAR(160) DEFAULT '',
      address TEXT,
      phone VARCHAR(50) DEFAULT '',
      zip VARCHAR(30) DEFAULT '',
      city VARCHAR(120) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      id TINYINT PRIMARY KEY,
      store_name VARCHAR(160) NOT NULL,
      sub_name VARCHAR(160) NOT NULL DEFAULT '',
      brand_image_url TEXT NOT NULL,
      hero_kicker VARCHAR(160) NOT NULL DEFAULT '',
      hero_title VARCHAR(255) NOT NULL DEFAULT '',
      hero_lead TEXT NOT NULL,
      hero_point_1 VARCHAR(255) NOT NULL DEFAULT '',
      hero_point_2 VARCHAR(255) NOT NULL DEFAULT '',
      hero_point_3 VARCHAR(255) NOT NULL DEFAULT '',
      shop_hero_kicker VARCHAR(160) NOT NULL DEFAULT '',
      shop_hero_title VARCHAR(255) NOT NULL DEFAULT '',
      shop_hero_lead TEXT NOT NULL,
      cart_hero_kicker VARCHAR(160) NOT NULL DEFAULT '',
      cart_hero_title VARCHAR(255) NOT NULL DEFAULT '',
      cart_hero_lead TEXT NOT NULL,
      checkout_hero_kicker VARCHAR(160) NOT NULL DEFAULT '',
      checkout_hero_title VARCHAR(255) NOT NULL DEFAULT '',
      checkout_hero_lead TEXT NOT NULL,
      shipping_cost INT NOT NULL,
      free_shipping_threshold INT NOT NULL,
      vat_percent INT NOT NULL DEFAULT 25,
        theme_mode VARCHAR(20) NOT NULL DEFAULT 'default',
        theme_custom_accent_hex VARCHAR(10) NOT NULL DEFAULT '#65ae6e',
        theme_custom_muted_hex VARCHAR(10) NOT NULL DEFAULT '#0f766e',
        theme_custom_danger_hex VARCHAR(10) NOT NULL DEFAULT '#be123c',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  const settingsColumnsToEnsure = [
    {
      name: 'sub_name',
      alterSql:
        "ALTER TABLE settings ADD COLUMN sub_name VARCHAR(160) NOT NULL DEFAULT '' AFTER store_name",
    },
    {
      name: 'brand_image_url',
      alterSql:
        'ALTER TABLE settings ADD COLUMN brand_image_url TEXT NULL AFTER sub_name',
    },
    {
      name: 'hero_kicker',
      alterSql:
        "ALTER TABLE settings ADD COLUMN hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER brand_image_url",
    },
    {
      name: 'hero_title',
      alterSql:
        "ALTER TABLE settings ADD COLUMN hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_kicker",
    },
    {
      name: 'hero_lead',
      alterSql:
        'ALTER TABLE settings ADD COLUMN hero_lead TEXT NULL AFTER hero_title',
    },
    {
      name: 'hero_point_1',
      alterSql:
        "ALTER TABLE settings ADD COLUMN hero_point_1 VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_lead",
    },
    {
      name: 'hero_point_2',
      alterSql:
        "ALTER TABLE settings ADD COLUMN hero_point_2 VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_point_1",
    },
    {
      name: 'hero_point_3',
      alterSql:
        "ALTER TABLE settings ADD COLUMN hero_point_3 VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_point_2",
    },
    {
      name: 'shop_hero_kicker',
      alterSql:
        "ALTER TABLE settings ADD COLUMN shop_hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER hero_point_3",
    },
    {
      name: 'shop_hero_title',
      alterSql:
        "ALTER TABLE settings ADD COLUMN shop_hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER shop_hero_kicker",
    },
    {
      name: 'shop_hero_lead',
      alterSql:
        'ALTER TABLE settings ADD COLUMN shop_hero_lead TEXT NULL AFTER shop_hero_title',
    },
    {
      name: 'cart_hero_kicker',
      alterSql:
        "ALTER TABLE settings ADD COLUMN cart_hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER shop_hero_lead",
    },
    {
      name: 'cart_hero_title',
      alterSql:
        "ALTER TABLE settings ADD COLUMN cart_hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER cart_hero_kicker",
    },
    {
      name: 'cart_hero_lead',
      alterSql:
        'ALTER TABLE settings ADD COLUMN cart_hero_lead TEXT NULL AFTER cart_hero_title',
    },
    {
      name: 'checkout_hero_kicker',
      alterSql:
        "ALTER TABLE settings ADD COLUMN checkout_hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER cart_hero_lead",
    },
    {
      name: 'checkout_hero_title',
      alterSql:
        "ALTER TABLE settings ADD COLUMN checkout_hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER checkout_hero_kicker",
    },
    {
      name: 'checkout_hero_lead',
      alterSql:
        'ALTER TABLE settings ADD COLUMN checkout_hero_lead TEXT NULL AFTER checkout_hero_title',
    },
    {
      name: 'shipping_cost',
      alterSql:
        'ALTER TABLE settings ADD COLUMN shipping_cost INT NOT NULL DEFAULT 0 AFTER checkout_hero_lead',
    },
    {
      name: 'free_shipping_threshold',
      alterSql:
        'ALTER TABLE settings ADD COLUMN free_shipping_threshold INT NOT NULL DEFAULT 0 AFTER shipping_cost',
    },
    {
      name: 'vat_percent',
      alterSql:
        'ALTER TABLE settings ADD COLUMN vat_percent INT NOT NULL DEFAULT 25 AFTER free_shipping_threshold',
    },
    {
      name: 'theme_mode',
      alterSql:
        "ALTER TABLE settings ADD COLUMN theme_mode VARCHAR(20) NOT NULL DEFAULT 'default' AFTER vat_percent",
    },
    {
      name: 'theme_custom_accent_hex',
      alterSql:
        "ALTER TABLE settings ADD COLUMN theme_custom_accent_hex VARCHAR(10) NOT NULL DEFAULT '#65ae6e' AFTER theme_mode",
    },
    {
      name: 'theme_custom_muted_hex',
      alterSql:
        "ALTER TABLE settings ADD COLUMN theme_custom_muted_hex VARCHAR(10) NOT NULL DEFAULT '#0f766e' AFTER theme_custom_accent_hex",
    },
    {
      name: 'theme_custom_danger_hex',
      alterSql:
        "ALTER TABLE settings ADD COLUMN theme_custom_danger_hex VARCHAR(10) NOT NULL DEFAULT '#be123c' AFTER theme_custom_muted_hex",
    },
  ] as const

  for (const column of settingsColumnsToEnsure) {
    const existingColumn = await query<Array<{ columnName: string }>>(
      `SELECT COLUMN_NAME AS columnName
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'settings'
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [column.name]
    )

    if (!existingColumn[0]) {
      await query(column.alterSql)
    }
  }
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
  const rows = await query<
    Array<{
      id: number
      name: string
      description: string
      price: number
      imageUrl: string
      groupId: number | null
    }>
  >(`
    SELECT id, name, description, price, image_url AS imageUrl, group_id AS groupId
    FROM products
    ORDER BY created_at ASC
  `)

  return rows
}

export const createProduct = async (rawPayload: unknown): Promise<Product> => {
  const payload = asRecord(rawPayload)
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const description =
    typeof payload.description === 'string' ? payload.description.trim() : ''
  const price = Number(payload.price)
  const imageUrl =
    typeof payload.imageUrl === 'string' && payload.imageUrl.trim()
      ? payload.imageUrl.trim()
      : DEFAULT_PRODUCT_IMAGE

  if (!name || !description || !Number.isFinite(price) || price < 0) {
    throw new Error('Invalid product payload')
  }

  const groupId = await normalizeGroupId(payload.groupId)

  const result = await query<ResultSetHeader>(
    'INSERT INTO products (name, description, price, image_url, group_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, Math.floor(price), imageUrl, groupId]
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

export const updateProduct = async (
  productId: number,
  rawPayload: unknown
): Promise<Product> => {
  const payload = asRecord(rawPayload)
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const description =
    typeof payload.description === 'string' ? payload.description.trim() : ''
  const price = Number(payload.price)
  const imageUrl =
    typeof payload.imageUrl === 'string' && payload.imageUrl.trim()
      ? payload.imageUrl.trim()
      : DEFAULT_PRODUCT_IMAGE

  if (!name || !description || !Number.isFinite(price) || price < 0) {
    throw new Error('Invalid product payload')
  }

  const groupId = await normalizeGroupId(payload.groupId)

  await query(
    'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, group_id = ? WHERE id = ?',
    [name, description, Math.floor(price), imageUrl, groupId, productId]
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
  const rows = await query<Array<{ id: number; name: string }>>(
    'SELECT id, name FROM `groups` ORDER BY created_at ASC'
  )
  return rows
}

export const createGroup = async (
  rawPayload: unknown
): Promise<ProductGroup> => {
  const payload = asRecord(rawPayload)
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''

  if (!name) {
    throw new Error('Invalid group payload')
  }

  const result = await query<ResultSetHeader>(
    'INSERT INTO `groups` (name) VALUES (?)',
    [name]
  )
  const id = result.insertId

  return { id, name }
}

export const updateGroup = async (
  groupId: number,
  rawPayload: unknown
): Promise<ProductGroup> => {
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
  const rows = await query<Array<ShopSettings>>(
    `SELECT
      store_name AS storeName,
      sub_name AS subName,
      brand_image_url AS brandImageUrl,
      hero_kicker AS heroKicker,
      hero_title AS heroTitle,
      hero_lead AS heroLead,
      hero_point_1 AS heroPoint1,
      hero_point_2 AS heroPoint2,
      hero_point_3 AS heroPoint3,
      shop_hero_kicker AS shopHeroKicker,
      shop_hero_title AS shopHeroTitle,
      shop_hero_lead AS shopHeroLead,
      cart_hero_kicker AS cartHeroKicker,
      cart_hero_title AS cartHeroTitle,
      cart_hero_lead AS cartHeroLead,
      checkout_hero_kicker AS checkoutHeroKicker,
      checkout_hero_title AS checkoutHeroTitle,
      checkout_hero_lead AS checkoutHeroLead,
      shipping_cost AS shippingCost,
      free_shipping_threshold AS freeShippingThreshold,
      vat_percent AS vatPercent,
      theme_mode AS themeMode,
      theme_custom_accent_hex AS themeCustomAccentHex,
      theme_custom_muted_hex AS themeCustomMutedHex,
      theme_custom_danger_hex AS themeCustomDangerHex
    FROM settings
    WHERE id = 1
    LIMIT 1`
  )

  if (!rows[0]) {
    return null
  }

  return rows[0]
}

export const updateSettings = async (
  rawPayload: unknown
): Promise<ShopSettings> => {
  const payload = asRecord(rawPayload)
  const currentSettings = await getSettings()

  const storeName =
    typeof payload.storeName === 'string' && payload.storeName.trim()
      ? payload.storeName.trim()
      : (currentSettings?.storeName ?? '')
  const subName =
    typeof payload.subName === 'string'
      ? payload.subName.trim()
      : (currentSettings?.subName ?? '')
  const brandImageUrl =
    typeof payload.brandImageUrl === 'string'
      ? payload.brandImageUrl.trim()
      : (currentSettings?.brandImageUrl ?? '')
  const heroKicker =
    typeof payload.heroKicker === 'string'
      ? payload.heroKicker.trim()
      : (currentSettings?.heroKicker ?? '')
  const heroTitle =
    typeof payload.heroTitle === 'string'
      ? payload.heroTitle.trim()
      : (currentSettings?.heroTitle ?? '')
  const heroLead =
    typeof payload.heroLead === 'string'
      ? payload.heroLead.trim()
      : (currentSettings?.heroLead ?? '')
  const heroPoint1 =
    typeof payload.heroPoint1 === 'string'
      ? payload.heroPoint1.trim()
      : (currentSettings?.heroPoint1 ?? '')
  const heroPoint2 =
    typeof payload.heroPoint2 === 'string'
      ? payload.heroPoint2.trim()
      : (currentSettings?.heroPoint2 ?? '')
  const heroPoint3 =
    typeof payload.heroPoint3 === 'string'
      ? payload.heroPoint3.trim()
      : (currentSettings?.heroPoint3 ?? '')
  const shopHeroKicker =
    typeof payload.shopHeroKicker === 'string'
      ? payload.shopHeroKicker.trim()
      : (currentSettings?.shopHeroKicker ?? '')
  const shopHeroTitle =
    typeof payload.shopHeroTitle === 'string'
      ? payload.shopHeroTitle.trim()
      : (currentSettings?.shopHeroTitle ?? '')
  const shopHeroLead =
    typeof payload.shopHeroLead === 'string'
      ? payload.shopHeroLead.trim()
      : (currentSettings?.shopHeroLead ?? '')
  const cartHeroKicker =
    typeof payload.cartHeroKicker === 'string'
      ? payload.cartHeroKicker.trim()
      : (currentSettings?.cartHeroKicker ?? '')
  const cartHeroTitle =
    typeof payload.cartHeroTitle === 'string'
      ? payload.cartHeroTitle.trim()
      : (currentSettings?.cartHeroTitle ?? '')
  const cartHeroLead =
    typeof payload.cartHeroLead === 'string'
      ? payload.cartHeroLead.trim()
      : (currentSettings?.cartHeroLead ?? '')
  const checkoutHeroKicker =
    typeof payload.checkoutHeroKicker === 'string'
      ? payload.checkoutHeroKicker.trim()
      : (currentSettings?.checkoutHeroKicker ?? '')
  const checkoutHeroTitle =
    typeof payload.checkoutHeroTitle === 'string'
      ? payload.checkoutHeroTitle.trim()
      : (currentSettings?.checkoutHeroTitle ?? '')
  const checkoutHeroLead =
    typeof payload.checkoutHeroLead === 'string'
      ? payload.checkoutHeroLead.trim()
      : (currentSettings?.checkoutHeroLead ?? '')
  const shippingCost = Number.isFinite(Number(payload.shippingCost))
    ? Math.max(0, Math.floor(Number(payload.shippingCost)))
    : (currentSettings?.shippingCost ?? 0)
  const freeShippingThreshold = Number.isFinite(
    Number(payload.freeShippingThreshold)
  )
    ? Math.max(0, Math.floor(Number(payload.freeShippingThreshold)))
    : (currentSettings?.freeShippingThreshold ?? 0)
  const vatPercent = Number.isFinite(Number(payload.vatPercent))
    ? Math.max(0, Math.floor(Number(payload.vatPercent)))
    : (currentSettings?.vatPercent ?? 25)

  // Theme fields
  const themeMode =
    typeof payload.themeMode === 'string'
      ? payload.themeMode
      : (currentSettings?.themeMode ?? 'default')
  const themeCustomAccentHex =
    typeof payload.themeCustomAccentHex === 'string'
      ? payload.themeCustomAccentHex
      : (currentSettings?.themeCustomAccentHex ?? '#65ae6e')
  const themeCustomMutedHex =
    typeof payload.themeCustomMutedHex === 'string'
      ? payload.themeCustomMutedHex
      : (currentSettings?.themeCustomMutedHex ?? '#0f766e')
  const themeCustomDangerHex =
    typeof payload.themeCustomDangerHex === 'string'
      ? payload.themeCustomDangerHex
      : (currentSettings?.themeCustomDangerHex ?? '#be123c')

  // Use explicit INSERT or UPDATE to avoid placeholder mismatch
  const existsRows = await query<Array<{ c: number }>>(
    'SELECT COUNT(*) AS c FROM settings WHERE id = 1'
  )

  const params = [
    storeName,
    subName,
    brandImageUrl,
    heroKicker,
    heroTitle,
    heroLead,
    heroPoint1,
    heroPoint2,
    heroPoint3,
    shopHeroKicker,
    shopHeroTitle,
    shopHeroLead,
    cartHeroKicker,
    cartHeroTitle,
    cartHeroLead,
    checkoutHeroKicker,
    checkoutHeroTitle,
    checkoutHeroLead,
    shippingCost,
    freeShippingThreshold,
    vatPercent,
    themeMode,
    themeCustomAccentHex,
    themeCustomMutedHex,
    themeCustomDangerHex,
  ]

  if (existsRows && existsRows[0]?.c > 0) {
    await query(
      `UPDATE settings SET
        store_name = ?,
        sub_name = ?,
        brand_image_url = ?,
        hero_kicker = ?,
        hero_title = ?,
        hero_lead = ?,
        hero_point_1 = ?,
        hero_point_2 = ?,
        hero_point_3 = ?,
        shop_hero_kicker = ?,
        shop_hero_title = ?,
        shop_hero_lead = ?,
        cart_hero_kicker = ?,
        cart_hero_title = ?,
        cart_hero_lead = ?,
        checkout_hero_kicker = ?,
        checkout_hero_title = ?,
        checkout_hero_lead = ?,
        shipping_cost = ?,
        free_shipping_threshold = ?,
        vat_percent = ?,
        theme_mode = ?,
        theme_custom_accent_hex = ?,
        theme_custom_muted_hex = ?,
        theme_custom_danger_hex = ?
      WHERE id = 1`,
      params
    )
  } else {
    await query(
      `INSERT INTO settings (
        id,
        store_name,
        sub_name,
        brand_image_url,
        hero_kicker,
        hero_title,
        hero_lead,
        hero_point_1,
        hero_point_2,
        hero_point_3,
        shop_hero_kicker,
        shop_hero_title,
        shop_hero_lead,
        cart_hero_kicker,
        cart_hero_title,
        cart_hero_lead,
        checkout_hero_kicker,
        checkout_hero_title,
        checkout_hero_lead,
        shipping_cost,
        free_shipping_threshold,
        vat_percent,
        theme_mode,
        theme_custom_accent_hex,
        theme_custom_muted_hex,
        theme_custom_danger_hex
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      params
    )
  }

  return {
    storeName,
    subName,
    brandImageUrl,
    heroKicker,
    heroTitle,
    heroLead,
    heroPoint1,
    heroPoint2,
    heroPoint3,
    shopHeroKicker,
    shopHeroTitle,
    shopHeroLead,
    cartHeroKicker,
    cartHeroTitle,
    cartHeroLead,
    checkoutHeroKicker,
    checkoutHeroTitle,
    checkoutHeroLead,
    shippingCost,
    freeShippingThreshold,
    vatPercent,
    themeMode,
    themeCustomAccentHex,
    themeCustomMutedHex,
    themeCustomDangerHex,
  }
}

export const getShopSnapshot = async () => {
  const [products, groups, settings] = await Promise.all([
    listProducts(),
    listGroups(),
    getSettings(),
  ])

  return {
    products,
    groups,
    settings,
  }
}

export type Order = {
  id: number
  customerName: string
  email: string
  address: string | null
  phone: string
  zip: string
  city: string
  items: unknown
  total: number
  shippingOptionId: number | null
  userId?: number | null
  shippingOptionName?: string | null
  shippingOptionPrice?: number | null
  status: string
  createdAt: string
  updatedAt: string
}

// ...existing code...
export const listOrders = async (filters?: {
  userId?: number
  email?: string
}): Promise<Order[]> => {
  let where = ''
  const params: any[] = []
  if (filters) {
    if (filters.userId) {
      where += 'user_id = ?'
      params.push(filters.userId)
    }
    if (filters.email) {
      if (where) where += ' AND '
      where += 'email = ?'
      params.push(filters.email)
    }
  }
  const rows = await query<Array<any>>(
    `
    SELECT o.id, o.customer_name AS customerName, o.email, o.address, o.phone, o.zip, o.city, o.items, o.total, o.shipping_option_id AS shippingOptionId, o.status, o.created_at AS createdAt, o.updated_at AS updatedAt, o.user_id,
           so.name AS shippingOptionName, so.price AS shippingOptionPrice
    FROM orders o
    LEFT JOIN shipping_options so ON o.shipping_option_id = so.id
    ${where ? 'WHERE ' + where : ''}
    ORDER BY o.created_at DESC
  `,
    params
  )
  try {
    return rows.map((r) => {
      let parsedItems = r.items
      try {
        if (typeof r.items === 'string') {
          parsedItems = JSON.parse(r.items || '[]')
        }
      } catch (err) {
        console.error('Failed to parse items for order:', r.id, err)
        parsedItems = []
      }
      return {
        ...r,
        items: parsedItems,
        shippingOptionName: r.shippingOptionName || null,
        shippingOptionPrice:
          typeof r.shippingOptionPrice === 'number'
            ? r.shippingOptionPrice
            : null,
      }
    })
  } catch (err) {
    console.error('Error mapping orders:', err)
    throw err
  }
}

export const createOrder = async (rawPayload: unknown): Promise<Order> => {
  const payload = asRecord(rawPayload)
  const customerName =
    typeof payload.customerName === 'string' ? payload.customerName.trim() : ''
  const email = typeof payload.email === 'string' ? payload.email.trim() : ''
  const address =
    typeof payload.address === 'string' ? payload.address.trim() : ''
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : ''
  const zip = typeof payload.zip === 'string' ? payload.zip.trim() : ''
  const city = typeof payload.city === 'string' ? payload.city.trim() : ''
  const items = Array.isArray(payload.items) ? payload.items : []
  const total = Number.isFinite(Number(payload.total))
    ? Math.max(0, Math.floor(Number(payload.total)))
    : 0
  const shippingOptionId = Number.isFinite(Number(payload.shippingOptionId))
    ? Math.floor(Number(payload.shippingOptionId))
    : null
  const userId = Number.isFinite(Number(payload.userId))
    ? Math.floor(Number(payload.userId))
    : null

  if (!customerName || !email || items.length === 0) {
    throw new Error('Invalid order payload')
  }

  const result = await query<ResultSetHeader>(
    'INSERT INTO orders (customer_name, email, user_id, address, phone, zip, city, items, total, shipping_option_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      customerName,
      email,
      userId,
      address,
      phone,
      zip,
      city,
      JSON.stringify(items),
      total,
      shippingOptionId,
      'pending',
    ]
  )

  const id = result.insertId

  return {
    id,
    customerName,
    email,
    address: address || null,
    phone,
    zip,
    city,
    items,
    total,
    shippingOptionId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId,
  }
}

export const updateOrderStatus = async (
  orderId: number,
  rawPayload: unknown
): Promise<Order> => {
  const payload = asRecord(rawPayload)
  const status =
    typeof payload.status === 'string' && payload.status.trim()
      ? payload.status.trim()
      : null

  if (!status) {
    throw new Error('Invalid status')
  }

  await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])

  const rows = await query<Array<any>>(
    'SELECT id, customer_name AS customerName, email, address, phone, zip, city, items, total, shipping_option_id AS shippingOptionId, status, created_at AS createdAt, updated_at AS updatedAt FROM orders WHERE id = ? LIMIT 1',
    [orderId]
  )

  if (!rows[0]) {
    throw new Error('Order not found')
  }

  const r = rows[0]
  return {
    ...r,
    items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : r.items,
  }
}

export const handleGroupById = async (req: any, res: any) => {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    sendMethodNotAllowed(res, ['PUT', 'DELETE'])
    return
  }

  const groupId = getQueryId(req)

  if (!groupId) {
    res.status(400).json({ error: 'Missing group id' })
    return
  }

  try {
    await ensureSchemaAndSeed()

    if (req.method === 'DELETE') {
      await deleteGroup(groupId)
      res.status(200).json({ ok: true })
      return
    }

    const group = await updateGroup(groupId, parseBody(req))
    res.status(200).json(group)
  } catch (error) {
    res
      .status(400)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle group request',
      })
  }
}

export const handleProductById = async (req: any, res: any) => {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
    sendMethodNotAllowed(res, ['PUT', 'DELETE'])
    return
  }

  const productId = getQueryId(req)

  if (!productId) {
    res.status(400).json({ error: 'Missing product id' })
    return
  }

  try {
    await ensureSchemaAndSeed()

    if (req.method === 'DELETE') {
      await deleteProduct(productId)
      res.status(200).json({ ok: true })
      return
    }

    const product = await updateProduct(productId, parseBody(req))
    res.status(200).json(product)
  } catch (error) {
    res
      .status(400)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle product request',
      })
  }
}
