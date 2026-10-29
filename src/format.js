// قالب‌بندی مشترک صفحه‌ها و ربات

export const fa = (n) => Number(n || 0).toLocaleString('fa-IR')

/** ارقام فارسی/عربی رو انگلیسی می‌کنه و جداکننده‌ها رو برمی‌داره. */
export const toNumber = (s) =>
  Number(
    String(s ?? '')
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[,٬،\s]/g, ''),
  )

/** ۲٬۵۰۰٬۰۰۰ → «۲ میلیون و ۵۰۰ هزار تومان» */
export function tomanWords(n) {
  n = Math.floor(Number(n) || 0)
  const parts = []
  const b = Math.floor(n / 1e9), m = Math.floor((n % 1e9) / 1e6), k = Math.floor((n % 1e6) / 1e3), r = n % 1e3
  if (b) parts.push(`${fa(b)} میلیارد`)
  if (m) parts.push(`${fa(m)} میلیون`)
  if (k) parts.push(`${fa(k)} هزار`)
  if (r) parts.push(fa(r))
  return (parts.join(' و ') || fa(0)) + ' تومان'
}

const DATE = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
})
export const faDate = (iso) => (iso ? DATE.format(new Date(iso)) : '')

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export const normalizePhone = (s) => {
  const d = String(toNumber(s) || '')
  if (/^9\d{9}$/.test(d)) return '0' + d
  if (/^989\d{9}$/.test(d)) return '0' + d.slice(2)
  return /^09\d{9}$/.test(d) ? d : ''
}
