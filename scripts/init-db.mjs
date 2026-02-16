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
      shipping_cost INT NOT NULL,
      free_shipping_threshold INT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  const [settingsColumnRows] = await connection.execute(`
    SELECT COLUMN_NAME AS columnName
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'settings'
      AND COLUMN_NAME = 'sub_name'
    LIMIT 1
  `)

  if (!Array.isArray(settingsColumnRows) || settingsColumnRows.length === 0) {
    await connection.execute("ALTER TABLE settings ADD COLUMN sub_name VARCHAR(160) NOT NULL DEFAULT '' AFTER store_name")
  }

  console.log('✅ Tables created/verified: groups, products, settings')
} finally {
  await connection.end()
}
