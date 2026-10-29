import { TG_TOKEN, TG_ADMIN_ID, TG_API, PUBLIC_URL, MIN_AMOUNT } from './config.js'
import * as store from './db.js'
import { esc, fa, faDate, toNumber, tomanWords } from './format.js'

export const enabled = Boolean(TG_TOKEN && TG_ADMIN_ID)
const HTTPS = PUBLIC_URL.startsWith('https://')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function tg(method, body = {}) {
  const res = await fetch(`${TG_API}/bot${TG_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(method === 'getUpdates' ? 70_000 : 20_000),
  })
  const json = await res.json().catch(() => ({}))
  if (!json.ok) throw new Error(`${method}: ${json.description ?? res.status}`)
  return json.result
}

const send = (text, keyboard) =>
  tg('sendMessage', { chat_id: TG_ADMIN_ID, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}) })

/** پیام قبلی رو عوض می‌کنه (حس اپ)؛ اگه نشد پیام تازه می‌فرسته. */
async function show(messageId, text, keyboard) {
  if (messageId) {
    try {
      return await tg('editMessageText', { chat_id: TG_ADMIN_ID, message_id: messageId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, reply_markup: { inline_keyboard: keyboard ?? [] } })
    } catch (e) {
      if (/not modified/.test(e.message)) return
    }
  }
  return send(text, keyboard)
}

const panelButton = (text = '🖥 پنل مدیریت') => (HTTPS ? { text, web_app: { url: `${PUBLIC_URL}/admin` } } : { text, url: `${PUBLIC_URL}/admin` })
const back = [{ text: '« منو', callback_data: 'menu' }]
const amountText = (l) => (l.amount ? `${fa(l.amount)} تومان` : 'مبلغ آزاد')
const STATE = { active: '🟣 فعال', paid: '✅ پرداخت شد', off: '⏸ غیرفعال' }
const PAY = { paid: '✅', failed: '❌', init: '⏳' }

const menuKeyboard = () => [
  [{ text: '➕ لینک پرداخت جدید', callback_data: 'new' }],
  [{ text: '🔗 لینک‌ها', callback_data: 'links' }, { text: '💳 پرداخت‌ها', callback_data: 'pays' }],
  [{ text: '📊 گزارش', callback_data: 'stats' }, panelButton('🖥 پنل')],
]

const HELP = `<b>💜 پرداخت من</b>

برای ساخت لینک پرداخت فقط مبلغ (تومان) و اگه خواستی عنوانش رو بفرست:
<code>250000 طراحی لوگو</code>

مبلغ <code>0</code> یعنی پرداخت‌کننده خودش مبلغ رو وارد کنه.

/new لینک جدید · /links لینک‌ها · /payments پرداخت‌ها · /stats گزارش`

function linkCard(l) {
  const lines = [
    `🧾 <b>${esc(l.title || 'لینک پرداخت')}</b>`,
    `💰 ${amountText(l)}${l.amount ? ` <i>(${tomanWords(l.amount)})</i>` : ''}`,
    `${STATE[l.state]} · ${l.single_use ? 'یک‌بار مصرف' : 'چندبار مصرف'}`,
  ]
  if (l.description) lines.push(`📝 ${esc(l.description)}`)
  if (l.paid_count) lines.push(`📥 دریافتی: ${fa(l.paid_sum)} تومان از ${fa(l.paid_count)} پرداخت`)
  lines.push(`🗓 ${faDate(l.created_at)}`, '', `🔗 ${l.url}`)
  return lines.join('\n')
}

function linkKeyboard(l) {
  const shareText = `${l.title || 'لینک پرداخت'} — ${amountText(l)}`
  return [
    [{ text: '📤 ارسال برای پرداخت‌کننده', url: `https://t.me/share/url?url=${encodeURIComponent(l.url)}&text=${encodeURIComponent(shareText)}` }],
    [
      l.active ? { text: '⏸ توقف', callback_data: `off:${l.id}` } : { text: '▶️ فعال‌سازی', callback_data: `on:${l.id}` },
      { text: '🗑 حذف', callback_data: `del:${l.id}` },
    ],
    [{ text: '« لینک‌ها', callback_data: 'links' }],
  ]
}

function linksView() {
  const links = store.listLinks(12)
  if (!links.length) return ['هنوز لینکی نساختی.\nمبلغ رو بفرست تا اولین لینک ساخته بشه.', [[{ text: '➕ لینک جدید', callback_data: 'new' }], back]]
  const kb = links.map((l) => [{ text: `${STATE[l.state].split(' ')[0]} ${l.title || 'بدون عنوان'} · ${amountText(l)}`, callback_data: `l:${l.id}` }])
  return [`🔗 <b>لینک‌های اخیر</b>\nروی هر کدوم بزن تا جزئیات و گزینه‌هاش رو ببینی.`, [...kb, back]]
}

function paymentsView() {
  const pays = store.listPayments({ limit: 15 })
  if (!pays.length) return ['هنوز پرداختی انجام نشده.', [back]]
  const lines = pays.map((p) =>
    `${PAY[p.status]} <b>${fa(p.amount)}</b> تومان · ${esc(p.payer_name || p.title || '—')}\n     <i>${faDate(p.paid_at || p.created_at)}</i>${p.ref_id ? ` · <code>${esc(p.ref_id)}</code>` : ''}`)
  return [`💳 <b>پرداخت‌های اخیر</b>\n\n${lines.join('\n')}`, [[panelButton('🖥 تاریخچه‌ی کامل')], back]]
}

function statsView() {
  const s = store.stats()
  return [
    `📊 <b>گزارش</b>

💰 کل دریافتی: <b>${fa(s.total_sum)}</b> تومان (${fa(s.total_count)} پرداخت)
📅 ۳۰ روز اخیر: <b>${fa(s.month_sum)}</b> تومان (${fa(s.month_count)} پرداخت)
☀️ امروز: <b>${fa(s.today_sum)}</b> تومان (${fa(s.today_count)} پرداخت)
🔗 لینک فعال: <b>${fa(s.active_links)}</b> از ${fa(s.links)}`,
    [back],
  ]
}

let awaitingAmount = false

/** «250000 طراحی لوگو» → لینک؛ null یعنی پیام عدد نبود. */
async function createFromText(text) {
  const m = String(text).trim().match(/^([0-9۰-۹٠-٩][0-9۰-۹٠-٩,٬،]*)\s*(?:تومان|تومن)?\s*([\s\S]*)$/)
  if (!m) return null
  const amount = toNumber(m[1])
  if (amount !== 0 && amount < MIN_AMOUNT) {
    await send(`⚠️ کمترین مبلغ ${fa(MIN_AMOUNT)} تومانه.`)
    return true
  }
  const [title, ...desc] = m[2].split('\n')
  const link = store.createLink({ amount: amount || null, title: title ?? '', description: desc.join('\n') })
  await send(`✨ <b>لینک پرداخت ساخته شد</b>\n\n${linkCard(link)}`, linkKeyboard(link))
  return true
}

async function onMessage(msg) {
  const text = (msg.text ?? '').trim()
  const [cmd] = text.split(/\s+/)
  const arg = text.slice(cmd.length).trim()
  switch (cmd.replace(/@\w+$/, '')) {
    case '/start': case '/menu': case '/help':
      awaitingAmount = false
      return send(HELP, menuKeyboard())
    case '/new':
      if (arg && (await createFromText(arg))) return
      awaitingAmount = true
      return send('💰 مبلغ رو به تومان بفرست؛ اگه خواستی بعدش عنوان هم بنویس:\n<code>500000 مشاوره</code>', [[{ text: 'لغو', callback_data: 'menu' }]])
    case '/links': return send(...linksView())
    case '/payments': return send(...paymentsView())
    case '/stats': return send(...statsView())
  }
  if (await createFromText(text)) { awaitingAmount = false; return }
  if (awaitingAmount) return send('⚠️ فقط عدد بفرست؛ مثلاً <code>250000</code>')
  return send(HELP, menuKeyboard())
}

async function onCallback(q) {
  const id = q.message?.message_id
  const [action, arg] = String(q.data).split(':')
  const linkId = Number(arg)
  await tg('answerCallbackQuery', { callback_query_id: q.id }).catch(() => {})
  switch (action) {
    case 'menu': awaitingAmount = false; return show(id, HELP, menuKeyboard())
    case 'new':
      awaitingAmount = true
      return show(id, '💰 مبلغ رو به تومان بفرست؛ اگه خواستی بعدش عنوان هم بنویس:\n<code>500000 مشاوره</code>\n\n<code>0</code> = مبلغ آزاد', [back])
    case 'links': return show(id, ...linksView())
    case 'pays': return show(id, ...paymentsView())
    case 'stats': return show(id, ...statsView())
    case 'l': {
      const l = store.getLink(linkId)
      return l ? show(id, linkCard(l), linkKeyboard(l)) : show(id, ...linksView())
    }
    case 'on': case 'off': {
      const l = store.setLinkActive(linkId, action === 'on')
      return l ? show(id, linkCard(l), linkKeyboard(l)) : show(id, ...linksView())
    }
    case 'del': {
      const l = store.getLink(linkId)
      if (!l) return show(id, ...linksView())
      return show(id, `🗑 لینک «${esc(l.title || amountText(l))}» حذف بشه؟\nپرداخت‌های موفقش توی تاریخچه می‌مونه.`, [
        [{ text: 'بله، حذف کن', callback_data: `del!:${l.id}` }, { text: 'نه', callback_data: `l:${l.id}` }],
      ])
    }
    case 'del!':
      store.deleteLink(linkId)
      return show(id, '🗑 لینک حذف شد.\n\n' + linksView()[0], linksView()[1])
  }
}

async function onUpdate(u) {
  const from = u.message?.from ?? u.callback_query?.from
  if (!from) return
  if (from.id !== TG_ADMIN_ID) {
    if (u.message) await tg('sendMessage', { chat_id: u.message.chat.id, text: 'این ربات شخصیه 🙂' })
    return
  }
  if (u.callback_query) return onCallback(u.callback_query)
  if (u.message?.text) return onMessage(u.message)
}

/** پیام پرداخت موفق برای صاحب ربات. */
export function notifyPaid(p) {
  if (!enabled) return
  const lines = [
    '✅ <b>پرداخت موفق</b>',
    '',
    `💰 <b>${fa(p.amount)}</b> تومان`,
    p.title && `🧾 بابت: ${esc(p.title)}`,
    (p.payer_name || p.payer_phone) && `👤 ${esc(p.payer_name)}${p.payer_phone ? ` · <code>${esc(p.payer_phone)}</code>` : ''}`,
    p.note && `💬 ${esc(p.note)}`,
    `🔖 کد پیگیری: <code>${esc(p.ref_id ?? '-')}</code>`,
    p.card_pan && `💳 کارت: <code>${esc(p.card_pan)}</code>`,
    `🕐 ${faDate(p.paid_at)}`,
  ].filter(Boolean)
  send(lines.join('\n'), [[panelButton('🖥 باز کردن پنل')]]).catch((e) => console.error('[tg] notify', e.message))
}

export async function startBot() {
  if (!enabled) return console.log('[tg] bot disabled (TG_BOT_TOKEN / TG_ADMIN_ID not set)')
  for (let attempt = 0; ; attempt++) {
    try {
      const me = await tg('getMe')
      await tg('deleteWebhook')
      await tg('setMyCommands', { commands: [
        { command: 'new', description: 'لینک پرداخت جدید' },
        { command: 'links', description: 'لینک‌ها' },
        { command: 'payments', description: 'پرداخت‌های اخیر' },
        { command: 'stats', description: 'گزارش دریافتی' },
        { command: 'menu', description: 'منو' },
      ] })
      if (HTTPS) await tg('setChatMenuButton', { chat_id: TG_ADMIN_ID, menu_button: { type: 'web_app', text: 'پنل', web_app: { url: `${PUBLIC_URL}/admin` } } })
      console.log(`[tg] bot @${me.username} ready via ${new URL(TG_API).host}`)
      break
    } catch (e) {
      if (attempt % 10 === 0) console.error('[tg] setup failed:', e.cause?.code ?? e.message)
      await sleep(Math.min(60_000, 3000 * (attempt + 1)))
    }
  }
  let offset = 0, fails = 0
  for (;;) {
    try {
      const updates = await tg('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] })
      fails = 0
      for (const u of updates) {
        offset = u.update_id + 1
        await onUpdate(u).catch((e) => console.error('[tg] update', e.message))
      }
    } catch (e) {
      if (fails++ % 10 === 0) console.error('[tg] poll:', e.cause?.code ?? e.message)
      await sleep(Math.min(30_000, 2000 * fails))
    }
  }
}
