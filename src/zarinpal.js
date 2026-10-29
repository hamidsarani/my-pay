import { randomBytes } from 'node:crypto'
import { MERCHANT, SANDBOX, PAY_PROXY_URL, PUBLIC_URL } from './config.js'

// زرین‌پال v4. مبلغ‌ها اینجا تومانه و به زرین‌پال ریالی (×۱۰) فرستاده می‌شه، هم در request و هم در verify.
const GATEWAY = SANDBOX ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com'
export const mock = !MERCHANT

// زرین‌پال فقط دامنه‌ی ثبت‌شده‌ی مرچنت رو قبول می‌کنه: callback_url و Referer ورود به درگاه هر دو از PAY_PROXY_URL.
const callbackUrl = () => (PAY_PROXY_URL ? `${PAY_PROXY_URL}/${new URL(PUBLIC_URL).host}/cb` : `${PUBLIC_URL}/cb`)
const startPayUrl = (authority) =>
  PAY_PROXY_URL ? `${PAY_PROXY_URL}/start/${authority}${SANDBOX ? '?sandbox=1' : ''}` : `${GATEWAY}/pg/StartPay/${authority}`

async function zp(path, payload) {
  const res = await fetch(`${GATEWAY}/pg/v4/payment/${path}.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ merchant_id: MERCHANT, ...payload }),
    signal: AbortSignal.timeout(20_000),
  })
  const json = await res.json().catch(() => ({}))
  return { data: json?.data ?? {}, errors: json?.errors }
}

/** پرداخت می‌سازه؛ آدرسی که مرورگر باید بهش «برود» (نه fetch) رو برمی‌گردونه. */
export async function requestPayment({ amount, description, mobile }) {
  if (mock) {
    const authority = 'MOCK' + randomBytes(12).toString('hex')
    return { authority, url: `${PUBLIC_URL}/mock/${authority}` }
  }
  const { data, errors } = await zp('request', {
    amount: amount * 10,
    callback_url: callbackUrl(),
    description: description.slice(0, 250) || 'پرداخت',
    ...(/^09\d{9}$/.test(mobile ?? '') ? { metadata: { mobile } } : {}),
  })
  if (data.code !== 100) {
    console.error('[zarinpal] request', JSON.stringify(errors))
    throw new Error('gateway')
  }
  return { authority: data.authority, url: startPayUrl(data.authority) }
}

export async function verifyPayment({ amount, authority }) {
  if (authority.startsWith('MOCK')) {
    return mock ? { ok: true, ref_id: String(Date.now()).slice(-9), card_pan: '6037******1234' } : { ok: false }
  }
  const { data, errors } = await zp('verify', { amount: amount * 10, authority })
  const ok = data.code === 100 || data.code === 101
  if (!ok) console.error('[zarinpal] verify', authority, JSON.stringify(errors))
  return { ok, ref_id: data.ref_id ? String(data.ref_id) : null, card_pan: data.card_pan ?? null }
}
