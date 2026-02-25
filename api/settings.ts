import {
  ensureSchemaAndSeed,
  getSettings,
  parseBody,
  sendMethodNotAllowed,
  updateSettings,
} from './_shop'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['GET', 'PUT'])
    return
  }

  try {
    await ensureSchemaAndSeed()

    if (req.method === 'GET') {
      const settings = await getSettings()
      res.status(200).json(settings)
      return
    }
    const payload = parseBody(req)
    console.log('PUT /api/settings payload:', payload)
    const settings = await updateSettings(payload)
    res.status(200).json(settings)
  } catch (error) {
    console.error('Settings handler error:', error)
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to handle settings request',
      stack:
        error instanceof Error && process.env.NODE_ENV !== 'production'
          ? error.stack
          : undefined,
    })
  }
}
