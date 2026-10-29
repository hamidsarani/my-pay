import { OWNER, MIN_AMOUNT } from './config.js'
import { esc, fa, faDate, tomanWords } from './format.js'

// پوسته‌ی مشترک صفحه‌های عمومی (پرداخت، رسید)
export const BASE_CSS = `
:root{
  --bg:#07071a;--ink:#f4f2ff;--muted:#a7a4c8;--faint:#6f6c93;
  --card:rgba(22,20,52,.62);--card-2:rgba(255,255,255,.045);--line:rgba(255,255,255,.09);
  --a1:#8b5cf6;--a2:#22d3ee;--a3:#f472b6;--ok:#34d399;--bad:#fb7185;--warn:#fbbf24;
  --radius:28px;--shadow:0 30px 80px -20px rgba(0,0,0,.65),0 0 0 1px var(--line) inset;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;min-height:100%}
body{background:var(--bg);color:var(--ink);font-family:Vazirmatn,Tahoma,system-ui,sans-serif;line-height:1.7;
  -webkit-font-smoothing:antialiased;overflow-x:hidden}
.aurora{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.aurora i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55;animation:float 18s ease-in-out infinite}
.aurora i:nth-child(1){width:520px;height:520px;background:var(--a1);top:-180px;right:-120px}
.aurora i:nth-child(2){width:420px;height:420px;background:var(--a2);bottom:-160px;left:-120px;animation-delay:-6s;opacity:.35}
.aurora i:nth-child(3){width:300px;height:300px;background:var(--a3);top:40%;left:55%;animation-delay:-12s;opacity:.25}
.aurora::after{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:22px 22px;mask-image:linear-gradient(#000,transparent 80%)}
@keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,30px) scale(1.12)}}
.wrap{position:relative;z-index:1;min-height:100vh;display:grid;place-items:center;padding:28px 16px}
.card{width:100%;max-width:440px;background:var(--card);backdrop-filter:blur(24px) saturate(140%);-webkit-backdrop-filter:blur(24px) saturate(140%);
  border-radius:var(--radius);box-shadow:var(--shadow);padding:28px 24px;animation:rise .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
.owner{display:flex;align-items:center;gap:12px;margin-bottom:22px}
.avatar{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;font-weight:800;font-size:20px;color:#fff;
  background:conic-gradient(from 200deg,var(--a1),var(--a3),var(--a2),var(--a1));box-shadow:0 10px 30px -8px var(--a1)}
.owner b{display:block;font-size:16px}.owner small{color:var(--muted);font-size:12.5px}
.chip{margin-inline-start:auto;display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ok);background:rgba(52,211,153,.1);
  border:1px solid rgba(52,211,153,.25);padding:4px 10px;border-radius:999px;white-space:nowrap}
h1{font-size:21px;margin:0 0 6px;font-weight:800;letter-spacing:-.2px}
.desc{color:var(--muted);margin:0 0 18px;font-size:14.5px;white-space:pre-line}
.amount-box{position:relative;border-radius:22px;padding:20px;margin:18px 0 20px;text-align:center;overflow:hidden;
  background:linear-gradient(135deg,rgba(139,92,246,.22),rgba(34,211,238,.12));border:1px solid rgba(255,255,255,.12)}
.amount-box::before{content:"";position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent,rgba(255,255,255,.08),transparent 30%);animation:spin 9s linear infinite}
@keyframes spin{to{transform:rotate(1turn)}}
.amount-box>*{position:relative}
.label{font-size:12.5px;color:var(--muted)}
.amount{font-size:38px;font-weight:900;letter-spacing:-.5px;line-height:1.3;margin-top:4px;
  background:linear-gradient(90deg,#fff,#d9ccff);-webkit-background-clip:text;background-clip:text;color:transparent}
.amount small{font-size:15px;font-weight:600;color:var(--muted);-webkit-text-fill-color:var(--muted);margin-inline-start:6px}
.words{font-size:12.5px;color:var(--muted);margin-top:2px}
.field{margin-bottom:12px}
.field label{display:block;font-size:13px;color:var(--muted);margin:0 4px 6px}
.input{width:100%;font:inherit;color:var(--ink);background:var(--card-2);border:1px solid var(--line);border-radius:16px;padding:13px 16px;outline:none;transition:.2s}
.input:focus{border-color:rgba(139,92,246,.7);box-shadow:0 0 0 4px rgba(139,92,246,.18);background:rgba(255,255,255,.07)}
.input::placeholder{color:var(--faint)}
.input.big{font-size:22px;font-weight:800;text-align:center;letter-spacing:.5px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border:0;cursor:pointer;font:inherit;font-weight:800;font-size:16px;
  color:#fff;padding:16px;border-radius:18px;margin-top:8px;text-decoration:none;overflow:hidden;
  background:linear-gradient(135deg,var(--a1),#6d28d9 45%,#0ea5e9);box-shadow:0 18px 40px -14px rgba(139,92,246,.9);transition:transform .15s,filter .2s}
.btn:hover{filter:brightness(1.08)}.btn:active{transform:scale(.98)}
.btn::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);transform:translateX(-120%);animation:shine 3.2s ease-in-out infinite}
@keyframes shine{60%,100%{transform:translateX(120%)}}
.btn.ghost{background:var(--card-2);box-shadow:none;border:1px solid var(--line);color:var(--ink)}.btn.ghost::after{display:none}
.btn[disabled]{opacity:.7;pointer-events:none}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:16px;font-size:12px;color:var(--faint)}
.chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:-2px 0 14px}
.chips button{border:1px solid var(--line);background:var(--card-2);color:var(--ink);font:inherit;font-size:13px;padding:6px 14px;border-radius:999px;cursor:pointer;transition:.2s}
.chips button:hover{border-color:rgba(139,92,246,.6);background:rgba(139,92,246,.15)}
textarea.input{resize:vertical;min-height:52px}
.err{background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.3);color:#fecdd3;border-radius:14px;padding:10px 14px;font-size:13.5px;margin-bottom:14px}
.state{text-align:center;padding-top:6px}
.badge-ic{width:92px;height:92px;margin:4px auto 18px;border-radius:50%;display:grid;place-items:center;position:relative}
.badge-ic.ok{background:radial-gradient(circle at 30% 30%,#6ee7b7,#059669);box-shadow:0 0 0 10px rgba(52,211,153,.12),0 20px 50px -10px #10b981}
.badge-ic.bad{background:radial-gradient(circle at 30% 30%,#fda4af,#e11d48);box-shadow:0 0 0 10px rgba(251,113,133,.12),0 20px 50px -10px #e11d48}
.badge-ic.muted{background:radial-gradient(circle at 30% 30%,#c4b5fd,#6d28d9);box-shadow:0 0 0 10px rgba(139,92,246,.12),0 20px 50px -10px #7c3aed}
.badge-ic svg{width:44px;height:44px;stroke:#fff;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}
.badge-ic.ok svg path{stroke-dasharray:40;stroke-dashoffset:40;animation:draw .6s .3s ease forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.receipt{margin:20px 0 6px;border-radius:20px;background:var(--card-2);border:1px dashed rgba(255,255,255,.14);padding:6px 16px;text-align:right}
.receipt div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px}
.receipt div:last-child{border:0}.receipt span{color:var(--muted)}.receipt b{font-weight:700;direction:ltr;unicode-bidi:plaintext}
.confetti{position:fixed;inset:0;pointer-events:none;z-index:2;overflow:hidden}
.confetti i{position:absolute;top:-12px;width:8px;height:14px;border-radius:2px;animation:fall linear forwards}
@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:.2}}
@media print{.aurora,.confetti,.btn{display:none}body{background:#fff;color:#000}.card{box-shadow:none;background:#fff}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`

const FONT = '<link rel="preconnect" href="https://cdn.jsdelivr.net"><link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet">'

export const layout = (title, body, extra = '') => `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#07071a"><meta name="robots" content="noindex">
<title>${esc(title)}</title>${FONT}
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%238b5cf6'/><stop offset='1' stop-color='%2322d3ee'/></linearGradient></defs><rect width='64' height='64' rx='18' fill='url(%23g)'/><path d='M18 34l9 9 19-21' stroke='white' stroke-width='6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>">
<style>${BASE_CSS}</style>${extra}</head>
<body><div class="aurora"><i></i><i></i><i></i></div><main class="wrap">${body}</main></body></html>`

const LOCK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
const ICONS = {
  ok: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bad: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  muted: '<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17h.01"/></svg>',
}

const ownerRow = () => `<div class="owner"><div class="avatar">${esc(OWNER.trim()[0] ?? 'پ')}</div>
  <div><b>${esc(OWNER)}</b><small>درخواست پرداخت</small></div><span class="chip">${LOCK} پرداخت امن</span></div>`

/** home = صفحه‌ی اصلی: هر کسی مبلغ و توضیح رو خودش می‌نویسه. */
export function payPage(link, { error = '', values = {}, home = false } = {}) {
  const fixed = link.amount != null
  const title = home ? `پرداخت به ${OWNER}` : link.title || 'پرداخت'
  const description = home ? 'مبلغ و بابتش رو بنویس و از درگاه امن زرین‌پال پرداخت کن.' : link.description
  const noteField = home
    ? `<div class="field"><label for="note">بابت</label><textarea class="input" id="note" name="note" rows="2" maxlength="200" placeholder="مثلاً هزینه‌ی مشاوره">${esc(values.note)}</textarea></div>`
    : `<div class="field"><label for="note">توضیح برای ${esc(OWNER.split(' ')[0])}</label><input class="input" id="note" name="note" maxlength="200" placeholder="اختیاری" value="${esc(values.note)}"></div>`
  const chips = home
    ? `<div class="chips">${[100000, 200000, 500000, 1000000].map((n) => `<button type="button" data-n="${n}">${fa(n)}</button>`).join('')}</div>`
    : ''
  return layout(home ? title : `${title} — ${OWNER}`, `<form class="card" method="post" id="f" novalidate>
  ${ownerRow()}
  <h1>${esc(title)}</h1>
  ${description ? `<p class="desc">${esc(description)}</p>` : ''}
  ${error ? `<div class="err">${esc(error)}</div>` : ''}
  ${fixed
    ? `<div class="amount-box"><div class="label">مبلغ قابل پرداخت</div><div class="amount">${fa(link.amount)}<small>تومان</small></div><div class="words">${tomanWords(link.amount)}</div></div>`
    : `<div class="field" style="margin-top:18px"><label for="amount">مبلغ (تومان)</label>
       <input class="input big" id="amount" name="amount" inputmode="numeric" autocomplete="off" placeholder="مثلاً ۵۰۰٬۰۰۰" value="${esc(values.amount)}" required>
       <div class="words" id="words" style="text-align:center;margin-top:6px">حداقل ${fa(MIN_AMOUNT)} تومان</div></div>${chips}`}
  ${home ? noteField : ''}
  <div class="row">
    <div class="field"><label for="name">نام شما</label><input class="input" id="name" name="name" maxlength="80" autocomplete="name" placeholder="اختیاری" value="${esc(values.name)}"></div>
    <div class="field"><label for="phone">موبایل</label><input class="input" id="phone" name="phone" inputmode="tel" maxlength="14" autocomplete="tel" placeholder="اختیاری" dir="ltr" style="text-align:right" value="${esc(values.phone)}"></div>
  </div>
  ${home ? '' : noteField}
  <button class="btn" id="go">${LOCK.replace(/14/g, '18')} <span id="go-t">${fixed ? `پرداخت ${fa(link.amount)} تومان` : 'ادامه و پرداخت'}</span></button>
  <div class="foot">${LOCK} اتصال مستقیم به درگاه امن زرین‌پال</div>
</form>
<script>
const f=document.getElementById('f'),a=document.getElementById('amount'),w=document.getElementById('words'),go=document.getElementById('go');
const en=s=>s.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g,'');
const fa=n=>Number(n).toLocaleString('fa-IR');
function words(n){const p=[],b=Math.floor(n/1e9),m=Math.floor(n%1e9/1e6),k=Math.floor(n%1e6/1e3),r=n%1e3;
  if(b)p.push(fa(b)+' میلیارد');if(m)p.push(fa(m)+' میلیون');if(k)p.push(fa(k)+' هزار');if(r)p.push(fa(r));return p.join(' و ')+' تومان'}
if(a){a.addEventListener('input',()=>{const n=Number(en(a.value));a.value=n?fa(n):'';w.textContent=n?words(n):'حداقل ${fa(MIN_AMOUNT)} تومان';
  document.getElementById('go-t').textContent=n?'پرداخت '+fa(n)+' تومان':'ادامه و پرداخت'});a.dispatchEvent(new Event('input'))}
document.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{a.value=b.dataset.n;a.dispatchEvent(new Event('input'))});
f.addEventListener('submit',e=>{if(a&&Number(en(a.value))<${MIN_AMOUNT}){e.preventDefault();a.focus();w.style.color='var(--bad)';return}
  go.disabled=true;document.getElementById('go-t').textContent='در حال اتصال به درگاه…'});
</script>`)
}

export function statePage({ kind, title, text, action = '' }) {
  return layout(title, `<div class="card state">${ownerRow()}
  <div class="badge-ic ${kind}">${ICONS[kind]}</div><h1>${esc(title)}</h1><p class="desc">${esc(text)}</p>${action}</div>`)
}

export function resultPage(p) {
  if (p.status !== 'paid') {
    return statePage({
      kind: 'bad', title: 'پرداخت انجام نشد',
      text: 'اگه مبلغی از حسابتون کم شده، حداکثر تا ۷۲ ساعت خودکار برمی‌گرده.',
      action: p.link_code ? `<a class="btn" href="${p.link_code === 'home' ? '/' : `/p/${esc(p.link_code)}`}">تلاش دوباره</a>` : '',
    })
  }
  const colors = ['#8b5cf6', '#22d3ee', '#f472b6', '#34d399', '#fbbf24']
  const confetti = Array.from({ length: 70 }, (_, i) =>
    `<i style="left:${(i * 37) % 100}%;background:${colors[i % 5]};animation-duration:${2.4 + ((i * 13) % 20) / 10}s;animation-delay:${((i * 7) % 15) / 10}s"></i>`).join('')
  return layout('پرداخت موفق', `<div class="confetti">${confetti}</div><div class="card state">${ownerRow()}
  <div class="badge-ic ok">${ICONS.ok}</div><h1>پرداخت با موفقیت انجام شد</h1>
  <p class="desc">ممنون${p.payer_name ? ` ${esc(p.payer_name)}` : ''}! مبلغ به دست ${esc(OWNER)} رسید.</p>
  <div class="amount-box" style="margin-bottom:0"><div class="label">مبلغ پرداخت‌شده</div><div class="amount">${fa(p.amount)}<small>تومان</small></div></div>
  <div class="receipt">
    ${p.title ? `<div><span>بابت</span><b>${esc(p.title)}</b></div>` : ''}
    <div><span>کد پیگیری</span><b>${esc(p.ref_id ?? '-')}</b></div>
    ${p.card_pan ? `<div><span>کارت</span><b>${esc(p.card_pan)}</b></div>` : ''}
    <div><span>تاریخ</span><b>${faDate(p.paid_at)}</b></div>
  </div>
  <button class="btn ghost" onclick="print()">ذخیره‌ی رسید</button></div>`)
}

export function mockPage(p) {
  return layout('درگاه آزمایشی', `<div class="card state">${ownerRow()}
  <div class="badge-ic muted">${ICONS.muted}</div><h1>درگاه آزمایشی</h1>
  <p class="desc">مرچنت زرین‌پال تنظیم نشده؛ پول واقعی جابه‌جا نمی‌شه.</p>
  <div class="amount-box"><div class="amount">${fa(p.amount)}<small>تومان</small></div></div>
  <a class="btn" href="/cb?Authority=${esc(p.authority)}&Status=OK">پرداخت موفق</a>
  <a class="btn ghost" href="/cb?Authority=${esc(p.authority)}&Status=NOK">انصراف</a></div>`)
}
