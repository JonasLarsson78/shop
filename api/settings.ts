export default async function handler(req: any, res: any) {
  try {
    const mod = await import('../server/handlers/settings/index.js')
    if (!mod || typeof mod.default !== 'function') {
      res.status(404).json({ error: 'Handler not found' })
      return
    }
    return await mod.default(req, res)
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Import error' })
  }
}
