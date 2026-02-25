import {
  createGroup,
  ensureSchemaAndSeed,
  listGroups,
  parseBody,
  sendMethodNotAllowed,
} from './_shop.js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendMethodNotAllowed(res, ['GET', 'POST'])
    return
  }

  try {
    await ensureSchemaAndSeed()

    if (req.method === 'GET') {
      const groups = await listGroups()
      res.status(200).json(groups)
      return
    }

    const group = await createGroup(parseBody(req))
    res.status(201).json(group)
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to handle groups request',
    })
  }
}
