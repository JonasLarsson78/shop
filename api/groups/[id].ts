import {
  deleteGroup,
  ensureSchemaAndSeed,
  getQueryId,
  parseBody,
  sendMethodNotAllowed,
  updateGroup,
} from '../_shop.js'

export default async function handler(req: any, res: any) {
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
