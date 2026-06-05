import { createHmac } from 'crypto'

export function superadminSessionToken(): string {
  const secret = process.env.SUPERADMIN_SESSION_SECRET ?? 'fallback-change-in-prod'
  return createHmac('sha256', secret)
    .update(`${process.env.SUPERADMIN_EMAIL}:${process.env.SUPERADMIN_PASSWORD}`)
    .digest('hex')
}
