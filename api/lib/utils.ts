// api/utils.ts
// Gemensam util för metod- och felhantering för Vercel endpoints

export function allowMethods(res: any, methods: string[]) {
  res.setHeader('Allow', methods.join(', '))
  res.status(405).json({ error: 'Method Not Allowed' })
}

export function handleError(res: any, error: unknown) {
  const message =
    error instanceof Error ? error.message : 'Internal Server Error'
  res.status(400).json({ error: message })
}

export function requireMethod(req: any, res: any, methods: string[]): boolean {
  if (!methods.includes(req.method)) {
    allowMethods(res, methods)
    return false
  }
  return true
}
