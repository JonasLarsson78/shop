// Catch-all API proxy that routes to server/handlers/* modules.
// It attempts to import ../server/handlers/{path}/index.js (fallback to .ts)
export default async function handler(req: any, res: any) {
  const raw = req.query && req.query.all
  let parts: string[] = []
  if (Array.isArray(raw)) parts = raw
  else if (typeof raw === 'string') parts = raw.split('/')

  if (!parts.length) {
    res.status(404).json({ error: 'Not Found' })
    return
  }

  const base = '../server/handlers/' + parts.join('/') + '/index'

  const tryImport = async (p: string) => {
    try {
      return await import(p)
    } catch (err) {
      return null
    }
  }

  // Try .js then .ts
  let mod = await tryImport(base + '.js')
  if (!mod) mod = await tryImport(base + '.ts')

  if (!mod || typeof mod.default !== 'function') {
    res.status(404).json({ error: 'Handler not found' })
    return
  }

  try {
    await mod.default(req, res)
  } catch (err: any) {
    const message = err && err.message ? err.message : 'Handler error'
    res.status(500).json({ error: message })
  }
}
