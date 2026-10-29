import { createHmac, timingSafeEqual } from 'node:crypto'
import { ADMIN_USER, ADMIN_PASS, SECRET, TG_TOKEN, TG_ADMIN_ID } from './config.js'

const hmac = (data) => createHmac('sha256', SECRET).update(data).digest('base64url')
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

const TTL = 30 * 864e5

export function issueToken(sub) {
  const payload = `${sub}.${Date.now() + TTL}`
  return `${payload}.${hmac(payload)}`
}

export function checkToken(token) {
  const i = token?.lastIndexOf('.') ?? -1
  if (i < 0) return false
  const payload = token.slice(0, i)
  if (!safeEq(hmac(payload), token.slice(i + 1))) return false
  return Number(payload.split('.').pop()) > Date.now()
}

// هر دو مقایسه همیشه انجام می‌شن تا زمان پاسخ چیزی لو نده
export const checkPassword = (user, pass) => Boolean(ADMIN_PASS) && Boolean(safeEq(user, ADMIN_USER) & safeEq(pass, ADMIN_PASS))

/** initData مینی‌اپ تلگرام رو با توکن ربات تأیید می‌کنه؛ فقط کاربر ادمین قبوله. */
export function checkTelegram(initData) {
  if (!TG_TOKEN || !TG_ADMIN_ID || typeof initData !== 'string') return false
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return false
  params.delete('hash')
  const dataCheck = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(TG_TOKEN).digest()
  if (!safeEq(createHmac('sha256', secret).update(dataCheck).digest('hex'), hash)) return false
  if (Date.now() / 1000 - Number(params.get('auth_date')) > 86400) return false
  try {
    return JSON.parse(params.get('user') || '{}').id === TG_ADMIN_ID
  } catch {
    return false
  }
}

// محدودیت ساده‌ی تلاش ناموفق ورود برای هر IP
const fails = new Map()
export function tooManyFails(ip) {
  const f = fails.get(ip)
  return Boolean(f && f.count >= 8 && Date.now() - f.at < 15 * 60e3)
}
export function noteFail(ip) {
  const f = fails.get(ip)
  fails.set(ip, f && Date.now() - f.at < 15 * 60e3 ? { count: f.count + 1, at: f.at } : { count: 1, at: Date.now() })
}
