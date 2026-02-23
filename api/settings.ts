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

    const settings = await updateSettings(parseBody(req))
    res.status(200).json(settings)
  } catch (error) {
    res
      .status(400)
      .json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to handle settings request',
      })
  }
}
