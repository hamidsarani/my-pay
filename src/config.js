import { randomBytes } from 'node:crypto'

const env = process.env
const trim = (v) => (v ?? '').replace(/\/$/, '')

export const PORT = Number(env.PORT || 3000)
// آدرس عمومی همین سرویس (مثلاً https://pay.hamidsarani.ir)
export const PUBLIC_URL = trim(env.PUBLIC_URL) || `http://localhost:${PORT}`
// korsi-pay روی دامنه‌ی ثبت‌شده‌ی مرچنت؛ هم callback و هم ورود به درگاه از این دامنه رد می‌شن. خالی = مستقیم.
export const PAY_PROXY_URL = trim(env.PAY_PROXY_URL)
// خالی = درگاه آزمایشی داخلی (/mock) برای توسعه
export const MERCHANT = env.ZARINPAL_MERCHANT || ''
export const SANDBOX = env.ZARINPAL_SANDBOX === '1'

export const ADMIN_USER = env.ADMIN_USER || 'admin'
export const ADMIN_PASS = env.ADMIN_PASS || ''
export const SECRET = env.SECRET || randomBytes(32).toString('hex')
if (!env.SECRET) console.warn('[config] SECRET is not set; sessions end on every restart')

export const TG_TOKEN = env.TG_BOT_TOKEN || ''
export const TG_ADMIN_ID = Number(env.TG_ADMIN_ID || 0)
export const TG_API = trim(env.TG_API) || 'https://api.telegram.org'

export const DB_PATH = env.DB_PATH || './data/my-pay.db'
export const OWNER = env.OWNER_NAME || 'حمید سارانی'
// کمترین مبلغی که زرین‌پال قبول می‌کنه (۱۵٬۰۰۰ ریال)
export const MIN_AMOUNT = 1500
