import http from 'node:http'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PORT, PUBLIC_URL, PAY_PROXY_URL, MIN_AMOUNT, OWNER } from './config.js'
import * as store from './db.js'
import { requestPayment, verifyPayment, mock } from './zarinpal.js'
import { issueToken, checkToken, checkPassword, checkTelegram, tooManyFails, noteFail } from './auth.js'
import { payPage, resultPage, statePage, mockPage, BASE_CSS } from './pages.js'
import { notifyPaid, startBot } from './telegram.js'
import { toNumber, normalizePhone } from './format.js'

// نسخه‌ی CSS در آدرسش، تا بعد از هر دیپلوی کش مرورگر نسخه‌ی قدیمی رو نگه نداره
const CSS_VERSION = createHash('sha1').update(BASE_CSS).digest('hex').slice(0, 10)
const ADMIN_HTML = readFileSync(new URL('../public/admin.html', import.meta.url), 'utf8').replace('/base.css', `/base.css?v=${CSS_VERSION}`)

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

const SECURITY = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' }
const send = (res, status, body, type, headers = {}) => {
  res.writeHead(status, { 'Content-Type': type, ...SECURITY, ...headers })
  res.end(body)
}
const html = (res, body, status = 200) => send(res, status, body, 'text/html; charset=utf-8', { 'Cache-Control': 'no-store' })
const json = (res, body, status = 200) => send(res, status, JSON.stringify(body), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' })
const redirect = (res, to) => send(res, 303, '', 'text/plain', { Location: to })

async function readBody(req) {
  let size = 0
  const chunks = []
  for await (const c of req) {
    if ((size += c.length) > 64 * 1024) throw new HttpError(413, 'درخواست خیلی بزرگه')
    chunks.push(c)
  }
  const raw = Buffer.concat(chunks).toString()
  if ((req.headers['content-type'] ?? '').includes('application/json')) {
    try { return JSON.parse(raw || '{}') } catch { throw new HttpError(400, 'JSON نامعتبر') }
  }
  return Object.fromEntries(new URLSearchParams(raw))
}

const clientIp = (req) => String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress).split(',')[0].trim()

function requireAdmin(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  if (!checkToken(token)) throw new HttpError(401, 'دوباره وارد شو')
}

// ─── پرداخت عمومی ──────────────────────────────────────────────

function closedPage(link) {
  if (!link) return statePage({ kind: 'muted', title: 'لینک پیدا نشد', text: 'این لینک پرداخت وجود نداره یا حذف شده.' })
  if (link.state === 'paid') return statePage({ kind: 'ok', title: 'این لینک پرداخت شده', text: 'پرداخت این لینک قبلاً با موفقیت انجام شده. ممنون!' })
  if (link.state === 'off') return statePage({ kind: 'muted', title: 'لینک غیرفعاله', text: `این لینک پرداخت فعلاً بسته‌ست. اگه فکر می‌کنی اشتباهه به ${OWNER} خبر بده.` })
  return null
}

async function startPay(req, res, code) {
  const link = store.getLinkByCode(code)
  const closed = closedPage(link)
  if (closed) return html(res, closed, link ? 410 : 404)
  const body = await readBody(req)
  const values = { amount: body.amount ?? '', name: (body.name ?? '').trim().slice(0, 80), phone: (body.phone ?? '').trim(), note: (body.note ?? '').trim().slice(0, 200) }
  const amount = link.amount ?? Math.floor(toNumber(values.amount))
  const phone = normalizePhone(values.phone)
  const home = link.code === store.HOME_CODE
  const fail = (error) => html(res, payPage(link, { error, values, home }), 400)
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) return fail(`مبلغ باید حداقل ${MIN_AMOUNT.toLocaleString('fa-IR')} تومان باشه`)
  if (amount > 200_000_000) return fail('مبلغ بیشتر از سقف درگاهه')
  if (values.phone && !phone) return fail('شماره موبایل درست نیست')
  let pay
  try {
    const about = home ? values.note || `پرداخت به ${OWNER}` : link.title || `پرداخت به ${OWNER}`
    pay = await requestPayment({ amount, mobile: phone, description: [about, values.name].filter(Boolean).join(' — ') })
  } catch {
    return fail('اتصال به درگاه برقرار نشد؛ چند لحظه دیگه دوباره امتحان کن')
  }
  store.createPayment({ link, amount, payer_name: values.name, payer_phone: phone, note: values.note, authority: pay.authority })
  // مرورگر باید به صفحه‌ی شروع روی دامنه‌ی مرچنت «برود» تا Referer زرین‌پال درست باشه
  redirect(res, pay.url)
}

async function callback(res, query) {
  const authority = query.get('Authority') ?? ''
  const p = store.getPayment(authority)
  if (!p) return html(res, statePage({ kind: 'bad', title: 'پرداخت پیدا نشد', text: 'اطلاعات این پرداخت پیدا نشد.' }), 404)
  if (p.status === 'init') {
    const result = query.get('Status') === 'OK' ? await verifyPayment({ amount: p.amount, authority }) : { ok: false }
    if (store.settlePayment(authority, result) && result.ok) notifyPaid(store.getPayment(authority))
  }
  const fresh = store.getPayment(authority)
  const link = fresh.link_id ? store.getLink(fresh.link_id) : null
  html(res, resultPage({ ...fresh, link_code: link && link.state === 'active' ? link.code : null }))
}

// ─── API پنل ──────────────────────────────────────────────────

async function apiRoute(req, res, path) {
  const m = req.method
  if (m === 'POST' && path === '/api/login') {
    const ip = clientIp(req)
    if (tooManyFails(ip)) throw new HttpError(429, 'تلاش زیاد بود؛ ۱۵ دقیقه دیگه امتحان کن')
    const { user, pass } = await readBody(req)
    if (!checkPassword(String(user ?? ''), String(pass ?? ''))) { noteFail(ip); throw new HttpError(401, 'نام کاربری یا رمز اشتباهه') }
    return json(res, { token: issueToken('admin') })
  }
  if (m === 'POST' && path === '/api/tg-login') {
    const { initData } = await readBody(req)
    if (!checkTelegram(initData)) throw new HttpError(403, 'دسترسی نداری')
    return json(res, { token: issueToken('tg') })
  }
  requireAdmin(req)
  if (m === 'GET' && path === '/api/stats') return json(res, store.stats())
  if (m === 'GET' && path === '/api/links') return json(res, store.listLinks(500))
  if (m === 'GET' && path === '/api/payments') return json(res, store.listPayments({ limit: 500 }))
  if (m === 'POST' && path === '/api/links') {
    const b = await readBody(req)
    const amount = b.amount == null || b.amount === '' ? null : Math.floor(toNumber(b.amount))
    if (amount != null && !(amount >= MIN_AMOUNT)) throw new HttpError(400, `مبلغ باید حداقل ${MIN_AMOUNT.toLocaleString('fa-IR')} تومان باشه`)
    if (amount > 200_000_000) throw new HttpError(400, 'مبلغ بیشتر از سقف درگاهه')
    return json(res, store.createLink({ amount, title: String(b.title ?? ''), description: String(b.description ?? ''), single_use: b.single_use !== false }), 201)
  }
  const one = path.match(/^\/api\/links\/(\d+)$/)
  if (one) {
    const id = Number(one[1])
    if (!store.getLink(id)) throw new HttpError(404, 'لینک پیدا نشد')
    if (m === 'PATCH') return json(res, store.setLinkActive(id, Boolean((await readBody(req)).active)))
    if (m === 'DELETE') return json(res, { ok: store.deleteLink(id) })
  }
  throw new HttpError(404, 'پیدا نشد')
}

// ─── مسیرها ─────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const path = url.pathname.replace(/\/+$/, '') || '/'
  try {
    if (path.startsWith('/api/')) return await apiRoute(req, res, path)
    if (path === '/') {
      if (req.method === 'POST') return await startPay(req, res, store.HOME_CODE)
      return html(res, payPage(store.homeLink(), { home: true }))
    }
    if (path === '/admin') return send(res, 200, ADMIN_HTML, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' })
    if (path === '/base.css') return send(res, 200, BASE_CSS, 'text/css; charset=utf-8', { 'Cache-Control': 'public, max-age=31536000, immutable' })
    if (path === '/health') return json(res, { ok: true, gateway: mock ? 'mock' : 'zarinpal', proxy: PAY_PROXY_URL || null })
    if (path === '/cb') return await callback(res, url.searchParams)
    const p = path.match(/^\/p\/([a-z0-9]{4,16})$/)
    if (p) {
      if (req.method === 'POST') return await startPay(req, res, p[1])
      const link = store.getLinkByCode(p[1])
      const closed = closedPage(link)
      return closed ? html(res, closed, link ? 410 : 404) : html(res, payPage(link))
    }
    const mk = path.match(/^\/mock\/(MOCK[a-f0-9]+)$/)
    if (mk && mock) {
      const pay = store.getPayment(mk[1])
      if (pay) return html(res, mockPage(pay))
    }
    html(res, statePage({ kind: 'muted', title: 'صفحه پیدا نشد', text: 'آدرسی که باز کردی وجود نداره.' }), 404)
  } catch (e) {
    const status = e.status ?? 500
    if (status >= 500) console.error(req.method, path, e)
    if (path.startsWith('/api/')) return json(res, { error: status >= 500 ? 'خطای سرور' : e.message }, status)
    html(res, statePage({ kind: 'bad', title: 'خطا', text: status >= 500 ? 'یه مشکلی پیش اومد؛ دوباره امتحان کن.' : e.message }), status)
  }
})

store.homeLink()
server.listen(PORT, () => {
  console.log(`my-pay on :${PORT} · ${PUBLIC_URL} · gateway: ${mock ? 'mock' : 'zarinpal'}${PAY_PROXY_URL ? ` via ${PAY_PROXY_URL}` : ''}`)
  startBot()
})
