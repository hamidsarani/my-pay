import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { DB_PATH, PUBLIC_URL } from './config.js'

mkdirSync(dirname(DB_PATH), { recursive: true })
const db = new DatabaseSync(DB_PATH)
db.exec(`
  pragma journal_mode = wal;
  pragma foreign_keys = off;
  create table if not exists links (
    id integer primary key,
    code text not null unique,
    title text not null default '',
    description text not null default '',
    amount integer,                       -- تومان؛ null = مبلغ رو پرداخت‌کننده وارد می‌کنه
    single_use integer not null default 1,
    active integer not null default 1,
    created_at text not null
  );
  create table if not exists payments (
    id integer primary key,
    link_id integer,
    title text not null default '',       -- عنوان لینک موقع پرداخت (اگه لینک حذف بشه هم می‌مونه)
    amount integer not null,              -- تومان
    payer_name text not null default '',
    payer_phone text not null default '',
    note text not null default '',
    authority text not null unique,
    status text not null default 'init',  -- init | paid | failed
    ref_id text,
    card_pan text,
    created_at text not null,
    paid_at text
  );
  create index if not exists payments_link on payments(link_id);
  create index if not exists payments_status on payments(status, created_at);
`)

const now = () => new Date().toISOString()
// بدون حروف و ارقام شبیه به هم
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const newCode = () => [...randomBytes(7)].map((b) => ALPHABET[b % ALPHABET.length]).join('')

export const linkUrl = (code) => `${PUBLIC_URL}/p/${code}`

const LINK_SELECT = `
  select l.*,
    (select count(*) from payments p where p.link_id = l.id and p.status = 'paid') as paid_count,
    (select coalesce(sum(amount), 0) from payments p where p.link_id = l.id and p.status = 'paid') as paid_sum
  from links l`

function decorate(l) {
  if (!l) return null
  const state = !l.active ? 'off' : l.single_use && l.paid_count > 0 ? 'paid' : 'active'
  return { ...l, single_use: Boolean(l.single_use), active: Boolean(l.active), state, url: linkUrl(l.code) }
}

export function createLink({ title = '', description = '', amount = null, single_use = true }) {
  const r = db
    .prepare('insert into links (code, title, description, amount, single_use, created_at) values (?, ?, ?, ?, ?, ?)')
    .run(newCode(), title.trim().slice(0, 120), description.trim().slice(0, 600), amount, single_use ? 1 : 0, now())
  return getLink(Number(r.lastInsertRowid))
}

export const getLink = (id) => decorate(db.prepare(`${LINK_SELECT} where l.id = ?`).get(id))
export const getLinkByCode = (code) => decorate(db.prepare(`${LINK_SELECT} where l.code = ?`).get(code))
export const listLinks = (limit = 100) => db.prepare(`${LINK_SELECT} order by l.id desc limit ?`).all(limit).map(decorate)

export function setLinkActive(id, active) {
  db.prepare('update links set active = ? where id = ?').run(active ? 1 : 0, id)
  return getLink(id)
}

/** لینک حذف می‌شه؛ تاریخچه‌ی پرداخت‌های موفقش می‌مونه، پرداخت‌های نیمه‌کاره پاک می‌شن. */
export function deleteLink(id) {
  db.prepare("delete from payments where link_id = ? and status != 'paid'").run(id)
  return db.prepare('delete from links where id = ?').run(id).changes > 0
}

export function createPayment({ link, amount, payer_name = '', payer_phone = '', note = '', authority }) {
  db.prepare(
    'insert into payments (link_id, title, amount, payer_name, payer_phone, note, authority, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(link.id, link.title, amount, payer_name, payer_phone, note, authority, now())
}

export const getPayment = (authority) => db.prepare('select * from payments where authority = ?').get(authority)

/** فقط اگه هنوز init باشه عوض می‌شه؛ true یعنی همین فراخوانی وضعیت رو ثبت کرد. */
export function settlePayment(authority, { ok, ref_id = null, card_pan = null }) {
  const r = db
    .prepare("update payments set status = ?, ref_id = ?, card_pan = ?, paid_at = ? where authority = ? and status = 'init'")
    .run(ok ? 'paid' : 'failed', ref_id, card_pan, ok ? now() : null, authority)
  return r.changes > 0
}

export function listPayments({ status = 'all', limit = 100 } = {}) {
  if (status === 'all') return db.prepare('select * from payments order by id desc limit ?').all(limit)
  return db.prepare('select * from payments where status = ? order by id desc limit ?').all(status, limit)
}

export function stats() {
  const since = (days) => new Date(Date.now() - days * 864e5).toISOString()
  const sum = (from) =>
    db.prepare("select count(*) as count, coalesce(sum(amount), 0) as total from payments where status = 'paid' and paid_at >= ?").get(from)
  const all = sum('')
  const month = sum(since(30))
  const today = sum(new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' }) + 'T00:00:00+03:30').toISOString())
  const links = listLinks(100000)
  return {
    total_sum: all.total, total_count: all.count,
    month_sum: month.total, month_count: month.count,
    today_sum: today.total, today_count: today.count,
    active_links: links.filter((l) => l.state === 'active').length,
    links: links.length,
  }
}
