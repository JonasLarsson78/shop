// Catch-all API proxy that routes to server/handlers/* modules.
// It attempts to import ../server/handlers/{path}/index.js (fallback to .ts)
import path from 'path'
import { pathToFileURL } from 'url'

// Statically import known handlers so the Vercel bundler includes them
import myOrdersHandler from '../server/handlers/my-orders/index.ts'
import settingsHandler from '../server/handlers/settings/index.ts'
import ordersCountHandler from '../server/handlers/orders-count/index.ts'

export default async function handler(req: any, res: any) {
  const raw = req.query && req.query.all
  let parts: string[] = []
  if (Array.isArray(raw)) parts = raw
  else if (typeof raw === 'string') parts = raw.split('/')

  // If runtime didn't populate `req.query.all`, derive parts from the URL path.
  if (!parts.length) {
    try {
      const base = 'http://localhost'
      const url = req.url ? new URL(req.url, base) : null
      let pathname = url ? url.pathname : req.path || ''
      // Remove leading /api/ or /api if present
      if (pathname === '/api' || pathname === '/api/') {
        pathname = ''
      } else if (pathname.startsWith('/api/')) {
        pathname = pathname.slice(5)
      }
      // Trim leading/trailing slashes and split
      parts = pathname.split('/').filter(Boolean)
    } catch {
      // leave parts empty on error
    }
  }

  if (!parts.length) {
    res.status(404).json({ error: 'Not Found' })
    return
  }

  // Map of static handlers included at build time
  const staticHandlers: Record<string, any> = {
    'my-orders': myOrdersHandler,
    settings: settingsHandler,
    'orders-count': ordersCountHandler,
  }

  // Resolve handler: try exact join, then first segment
  const routeKey = parts.join('/')
  let mod = staticHandlers[routeKey] ?? staticHandlers[parts[0]]

  // Fallback: try dynamic import via file URL (may not be bundled on Vercel)
  if (!mod) {
    const handlersDir = path.join(process.cwd(), 'server', 'handlers')
    const baseFs = path.join(handlersDir, ...parts, 'index')
    const tryImportFile = async (fsPath: string) => {
      try {
        const url = pathToFileURL(fsPath).href
        return await import(url)
      } catch (err) {
        return null
      }
    }

    // Try .js then .ts (runtime may have compiled .js)
    mod = await tryImportFile(baseFs + '.js')
    if (!mod) mod = await tryImportFile(baseFs + '.ts')
  }

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
