import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const

const getEnvValue = (key: string) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }

  return value
}

const getPool = () => {
  if (pool) {
    return pool
  }

  for (const key of requiredEnv) {
    getEnvValue(key)
  }

  pool = mysql.createPool({
    host: getEnvValue('DB_HOST'),
    user: getEnvValue('DB_USER'),
    password: getEnvValue('DB_PASSWORD'),
    database: getEnvValue('DB_NAME'),
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  })

  return pool
}

export const query = async <T = unknown>(
  sql: string,
  params: unknown[] = []
) => {
  const [rows] = await getPool().query(sql, params)
  return rows as T
}
