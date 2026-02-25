import {
  ensureSchemaAndSeed,
  getSettings,
  parseBody,
  updateSettings,
} from '../../../api/lib/_shop.js'
import { requireMethod, handleError } from '../../../api/utils.js'

export default async function handler(req: any, res: any) {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return
  try {
    await ensureSchemaAndSeed()
    if (req.method === 'GET') {
      const settings = await getSettings()
      res.status(200).json(settings)
      return
    }
    const payload = parseBody(req)
    const settings = await updateSettings(payload)
    res.status(200).json(settings)
  } catch (error) {
    handleError(res, error)
  }
}
