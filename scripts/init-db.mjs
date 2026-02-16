import mysql from 'mysql2/promise'

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`)
    process.exit(1)
  }
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
})

const numericSqlTypes = new Set(['tinyint', 'smallint', 'mediumint', 'int', 'bigint'])

try {
  const [columnRows] = await connection.execute(`
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

  const hasLegacyType = Array.isArray(columnRows)
    ? columnRows.some((column) => {
      if (!column || typeof column !== 'object' || !('dataType' in column)) {
        return false
      }

      const dataType = String(column.dataType).toLowerCase()
      return !numericSqlTypes.has(dataType)
    })
    : false

  if (hasLegacyType) {
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0')
    await connection.execute('DROP TABLE IF EXISTS products')
    await connection.execute('DROP TABLE IF EXISTS `groups`')
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1')
  }

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`groups\` (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await connection.execute(`
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

  await connection.execute(`
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS shipping_options (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      price INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  const settingsColumnsToEnsure = [
    {
      name: 'sub_name',
      alterSql: "ALTER TABLE settings ADD COLUMN sub_name VARCHAR(160) NOT NULL DEFAULT '' AFTER store_name",
    },
    {
      name: 'brand_image_url',
      alterSql: "ALTER TABLE settings ADD COLUMN brand_image_url TEXT NULL AFTER sub_name",
    },
    {
      name: 'hero_kicker',
      alterSql: "ALTER TABLE settings ADD COLUMN hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER brand_image_url",
    },
    {
      name: 'hero_title',
      alterSql: "ALTER TABLE settings ADD COLUMN hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_kicker",
    },
    {
      name: 'hero_lead',
      alterSql: "ALTER TABLE settings ADD COLUMN hero_lead TEXT NULL AFTER hero_title",
    },
    {
      name: 'hero_point_1',
      alterSql: "ALTER TABLE settings ADD COLUMN hero_point_1 VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_lead",
    },
    {
      name: 'hero_point_2',
      alterSql: "ALTER TABLE settings ADD COLUMN hero_point_2 VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_point_1",
    },
    {
      name: 'hero_point_3',
      alterSql: "ALTER TABLE settings ADD COLUMN hero_point_3 VARCHAR(255) NOT NULL DEFAULT '' AFTER hero_point_2",
    },
    {
      name: 'shop_hero_kicker',
      alterSql: "ALTER TABLE settings ADD COLUMN shop_hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER hero_point_3",
    },
    {
      name: 'shop_hero_title',
      alterSql: "ALTER TABLE settings ADD COLUMN shop_hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER shop_hero_kicker",
    },
    {
      name: 'shop_hero_lead',
      alterSql: "ALTER TABLE settings ADD COLUMN shop_hero_lead TEXT NULL AFTER shop_hero_title",
    },
    {
      name: 'cart_hero_kicker',
      alterSql: "ALTER TABLE settings ADD COLUMN cart_hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER shop_hero_lead",
    },
    {
      name: 'cart_hero_title',
      alterSql: "ALTER TABLE settings ADD COLUMN cart_hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER cart_hero_kicker",
    },
    {
      name: 'cart_hero_lead',
      alterSql: "ALTER TABLE settings ADD COLUMN cart_hero_lead TEXT NULL AFTER cart_hero_title",
    },
    {
      name: 'checkout_hero_kicker',
      alterSql: "ALTER TABLE settings ADD COLUMN checkout_hero_kicker VARCHAR(160) NOT NULL DEFAULT '' AFTER cart_hero_lead",
    },
    {
      name: 'checkout_hero_title',
      alterSql: "ALTER TABLE settings ADD COLUMN checkout_hero_title VARCHAR(255) NOT NULL DEFAULT '' AFTER checkout_hero_kicker",
    },
    {
      name: 'checkout_hero_lead',
      alterSql: "ALTER TABLE settings ADD COLUMN checkout_hero_lead TEXT NULL AFTER checkout_hero_title",
    },
  ]

  for (const column of settingsColumnsToEnsure) {
    const [columnRows] = await connection.execute(
      `SELECT COLUMN_NAME AS columnName
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'settings'
         AND COLUMN_NAME = ?
       LIMIT 1`,
      [column.name],
    )

    if (!Array.isArray(columnRows) || columnRows.length === 0) {
      await connection.execute(column.alterSql)
    }
  }

  console.log('✅ Tables created/verified: groups, products, settings, shipping_options')
} finally {
  await connection.end()
}
