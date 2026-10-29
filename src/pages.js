import { OWNER, MIN_AMOUNT, PUBLIC_URL, PAY_PROXY_URL } from './config.js'
import { esc, fa, faDate, tomanWords } from './format.js'

const HOST = new URL(PUBLIC_URL).host
const GATEWAY_HOST = PAY_PROXY_URL ? new URL(PAY_PROXY_URL).host : 'zarinpal.com'

// پوسته‌ی مشترک صفحه‌ها و پنل: تیره به‌عنوان پیش‌فرض، روشن با prefers-color-scheme یا data-theme
export const BASE_CSS = `
:root{
  --bg:#09090b;--surface:#111113;--raised:#18181b;--ink:#ededef;--muted:#a1a1aa;--faint:#71717a;
  --line:#232326;--line-2:#1b1b1e;--grid:rgba(255,255,255,.035);
  --accent:#3ddc97;--on-accent:#03140c;--accent-soft:rgba(61,220,151,.1);--accent-line:rgba(61,220,151,.35);--focus:rgba(61,220,151,.22);
  --ok:#3ddc97;--ok-bg:rgba(61,220,151,.1);--bad:#f87171;--bad-bg:rgba(248,113,113,.1);--warn:#fbbf24;--warn-bg:rgba(251,191,36,.1);--info:#a5b4fc;--info-bg:rgba(129,140,248,.12);
  --shadow:0 0 0 1px rgba(0,0,0,.3),0 24px 60px -24px rgba(0,0,0,.7);--hi:inset 0 1px 0 rgba(255,255,255,.04);
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  color-scheme:dark;
}
@media (prefers-color-scheme:light){:root:not([data-theme=dark]){
  --bg:#fafafa;--surface:#fff;--raised:#f4f4f5;--ink:#09090b;--muted:#52525b;--faint:#a1a1aa;
  --line:#e4e4e7;--line-2:#f0f0f2;--grid:rgba(0,0,0,.04);
  --accent:#0f9d63;--on-accent:#fff;--accent-soft:rgba(15,157,99,.08);--accent-line:rgba(15,157,99,.35);--focus:rgba(15,157,99,.18);
  --ok:#0f9d63;--ok-bg:rgba(15,157,99,.08);--bad:#dc2626;--bad-bg:rgba(220,38,38,.07);--warn:#b45309;--warn-bg:rgba(180,83,9,.08);--info:#4f46e5;--info-bg:rgba(79,70,229,.08);
  --shadow:0 1px 2px rgba(0,0,0,.04),0 16px 40px -20px rgba(0,0,0,.18);--hi:none;color-scheme:light}}
:root[data-theme=light]{
  --bg:#fafafa;--surface:#fff;--raised:#f4f4f5;--ink:#09090b;--muted:#52525b;--faint:#a1a1aa;
  --line:#e4e4e7;--line-2:#f0f0f2;--grid:rgba(0,0,0,.04);
  --accent:#0f9d63;--on-accent:#fff;--accent-soft:rgba(15,157,99,.08);--accent-line:rgba(15,157,99,.35);--focus:rgba(15,157,99,.18);
  --ok:#0f9d63;--ok-bg:rgba(15,157,99,.08);--bad:#dc2626;--bad-bg:rgba(220,38,38,.07);--warn:#b45309;--warn-bg:rgba(180,83,9,.08);--info:#4f46e5;--info-bg:rgba(79,70,229,.08);
  --shadow:0 1px 2px rgba(0,0,0,.04),0 16px 40px -20px rgba(0,0,0,.18);--hi:none;color-scheme:light}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;min-height:100%}
body{background:var(--bg);color:var(--ink);font-family:Vazirmatn,Tahoma,system-ui,sans-serif;font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:40px 40px;
  -webkit-mask-image:radial-gradient(ellipse 70% 55% at 50% 0%,#000 30%,transparent 100%);mask-image:radial-gradient(ellipse 70% 55% at 50% 0%,#000 30%,transparent 100%)}
body::after{content:"";position:fixed;left:50%;top:-260px;width:720px;height:420px;transform:translateX(-50%);z-index:-1;pointer-events:none;
  background:radial-gradient(closest-side,var(--accent-soft),transparent)}
::selection{background:var(--accent);color:var(--on-accent)}
.mono,code,kbd{font-family:var(--mono);font-feature-settings:"zero"}
code{direction:ltr;unicode-bidi:isolate}
.wrap{min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:7vh 16px 40px}
.stack{width:100%;max-width:440px}
.brand{display:flex;align-items:center;gap:10px;margin:0 2px 14px;font-size:13px}
.mark{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;background:var(--ink);color:var(--bg);font-weight:800;font-size:13px}
.path{color:var(--muted);direction:ltr;font-size:12.5px}.path i{font-style:normal;color:var(--faint);margin:0 5px}.path b{color:var(--ink);font-weight:500}
.status{margin-inline-start:auto;display:inline-flex;align-items:center;gap:6px;color:var(--muted);font-size:12px}
.status i{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 0 6px transparent}}
.card{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow),var(--hi);padding:26px 24px 22px;animation:in .3s ease-out both}
.card::before{content:"";position:absolute;top:-1px;left:18%;right:18%;height:1px;background:linear-gradient(90deg,transparent,var(--accent-line),transparent)}
@keyframes in{from{opacity:0;transform:translateY(6px)}}
.eyebrow{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);margin-bottom:6px}
.eyebrow code{font-size:11.5px;color:var(--faint);background:var(--raised);border:1px solid var(--line);padding:0 6px;border-radius:5px;direction:ltr}
h1{font-size:21px;margin:0 0 4px;font-weight:800;letter-spacing:-.2px;line-height:1.5}
.desc{color:var(--muted);margin:0 0 4px;font-size:14px;white-space:pre-line}
.amount-box{margin:20px 0 18px;padding:16px 18px;border-radius:10px;background:var(--raised);border:1px solid var(--line)}
.amount-head{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--muted)}
.tag{font-family:var(--mono);font-size:10.5px;letter-spacing:.5px;color:var(--faint);border:1px solid var(--line);padding:0 6px;border-radius:5px}
.amount{font-size:34px;font-weight:800;letter-spacing:-.5px;line-height:1.3;margin-top:4px;font-variant-numeric:tabular-nums}
.amount small{font-size:14px;font-weight:500;color:var(--muted);margin-inline-start:6px}
.words{font-size:12.5px;color:var(--muted)}
.field{margin-bottom:14px}
.field label,.flabel{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;margin:0 1px 7px}
.field label small,.flabel small{font-weight:400;color:var(--faint);font-size:12px}
.input{width:100%;font:inherit;font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:10px 13px;outline:none;transition:border-color .15s,box-shadow .15s}
.input:hover{border-color:color-mix(in srgb,var(--line),var(--faint) 35%)}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--focus)}
.input::placeholder{color:var(--faint)}
textarea.input{resize:vertical;min-height:46px;line-height:1.6}
.amount-input{position:relative}
.amount-input .input{font-size:26px;font-weight:800;padding:12px 64px 12px 14px;letter-spacing:-.3px;font-variant-numeric:tabular-nums}
.amount-input span{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:13px;pointer-events:none}
.hint{font-size:12.5px;color:var(--muted);margin:7px 1px 0;min-height:21px}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 0}
.chips button{font:inherit;font-size:12.5px;color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:7px;padding:3px 10px;cursor:pointer;transition:.15s;font-variant-numeric:tabular-nums}
.chips button:hover{color:var(--ink);border-color:var(--accent-line);background:var(--accent-soft)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sep{height:1px;background:var(--line-2);margin:18px -24px}
.btn{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;border:1px solid transparent;cursor:pointer;font:inherit;font-weight:700;font-size:15px;
  color:var(--on-accent);background:var(--accent);padding:12px 16px;border-radius:9px;margin-top:4px;text-decoration:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 6px 20px -8px var(--accent);transition:filter .15s,transform .1s}
.btn:hover{filter:brightness(1.07)}.btn:active{transform:translateY(1px)}
.btn kbd{font-size:11px;font-weight:500;padding:0 6px;border-radius:5px;background:rgba(0,0,0,.14);line-height:1.7}
.btn.ghost{background:var(--surface);color:var(--ink);border-color:var(--line);box-shadow:none}
.btn.ghost:hover{filter:none;background:var(--raised)}
.btn[disabled]{opacity:.6;pointer-events:none}
.spin{width:15px;height:15px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:rot .7s linear infinite;display:none}
.btn[disabled] .spin{display:block}.btn[disabled] kbd{display:none}
@keyframes rot{to{transform:rotate(1turn)}}
.secure{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;font-size:12px;color:var(--faint)}
.secure svg{color:var(--accent)}
.legal{display:flex;justify-content:center;gap:8px;margin-top:16px;font-size:11px;color:var(--faint);direction:ltr}
.legal i{font-style:normal;opacity:.5}
.err{display:flex;gap:8px;align-items:flex-start;background:var(--bad-bg);border:1px solid color-mix(in srgb,var(--bad) 30%,transparent);color:var(--bad);border-radius:9px;padding:9px 12px;font-size:13.5px;margin:14px 0 0}
.state{text-align:center;padding-top:30px}
.badge-ic{width:52px;height:52px;margin:0 auto 16px;border-radius:14px;display:grid;place-items:center;border:1px solid}
.badge-ic.ok{background:var(--ok-bg);color:var(--ok);border-color:color-mix(in srgb,var(--ok) 30%,transparent)}
.badge-ic.bad{background:var(--bad-bg);color:var(--bad);border-color:color-mix(in srgb,var(--bad) 30%,transparent)}
.badge-ic.muted{background:var(--raised);color:var(--muted);border-color:var(--line)}
.badge-ic svg{width:24px;height:24px;stroke:currentColor;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
.badge-ic.ok svg path{stroke-dasharray:24;stroke-dashoffset:24;animation:draw .45s .15s ease-out forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.receipt{margin:18px 0 14px;border:1px solid var(--line);border-radius:10px;text-align:right;overflow:hidden}
.receipt div{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;font-size:13.5px}
.receipt div+div{border-top:1px dashed var(--line)}
.receipt span{color:var(--muted)}.receipt b{font-weight:600;font-variant-numeric:tabular-nums}
.receipt code{font-size:12.5px;direction:ltr}
.copy{border:1px solid var(--line);background:var(--raised);color:var(--muted);font:inherit;font-size:11px;padding:1px 8px;border-radius:5px;cursor:pointer;margin-inline-start:8px}
.copy:hover{color:var(--ink)}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media print{body::before,body::after,.btn,.brand .status,.actions{display:none}body{background:#fff;color:#000}.card{border:0;box-shadow:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`

const FONT = '<link rel="preconnect" href="https://cdn.jsdelivr.net">'
  + '<link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet">'
  + '<link href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.20/400.css" rel="stylesheet">'
export const FONT_LINKS = FONT

export const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%2309090b'/><path d='M19 33l9 9 17-19' stroke='%233ddc97' stroke-width='6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>">`

const brand = (route) => `<header class="brand"><span class="mark">${esc(OWNER.trim()[0] ?? 'پ')}</span>
  <span class="path mono">${esc(HOST)}${route ? `<i>/</i><b>${esc(route)}</b>` : ''}</span>
  <span class="status"><i></i>درگاه فعال</span></header>`

export const layout = (title, body, { route = '' } = {}) => `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)"><meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)">
<meta name="robots" content="noindex"><title>${esc(title)}</title>${FONT}${FAVICON}
<style>${BASE_CSS}</style></head>
<body><main class="wrap"><div class="stack">${brand(route)}${body}
<footer class="legal mono"><span>TLS</span><i>·</i><span>ZarinPal</span><i>·</i><span>${esc(GATEWAY_HOST)}</span></footer></div></main></body></html>`

const LOCK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
const ALERT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="flex:none;margin-top:3px"><circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/></svg>'
const ICONS = {
  ok: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bad: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  muted: '<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17h.01"/></svg>',
}

/** home = صفحه‌ی اصلی: هر کسی مبلغ و توضیح رو خودش می‌نویسه. */
export function payPage(link, { error = '', values = {}, home = false } = {}) {
  const fixed = link.amount != null
  const title = home ? `پرداخت به ${OWNER}` : link.title || 'پرداخت'
  const description = home ? 'مبلغ و بابتش رو بنویس؛ پرداخت از درگاه امن زرین‌پال انجام می‌شه.' : link.description
  const noteField = home
    ? `<div class="field"><label for="note">بابت <small>اختیاری</small></label><textarea class="input" id="note" name="note" rows="2" maxlength="200" placeholder="مثلاً هزینه‌ی مشاوره">${esc(values.note)}</textarea></div>`
    : `<div class="field"><label for="note">پیام برای ${esc(OWNER.split(' ')[0])} <small>اختیاری</small></label><input class="input" id="note" name="note" maxlength="200" value="${esc(values.note)}"></div>`
  const chips = home ? `<div class="chips">${[100000, 200000, 500000, 1000000].map((n) => `<button type="button" data-n="${n}">${fa(n)}</button>`).join('')}</div>` : ''
  return layout(home ? title : `${title} — ${OWNER}`, `<form class="card" method="post" id="f" novalidate>
  <div class="eyebrow">${home ? 'پرداخت آزاد' : 'درخواست پرداخت'}${home ? '' : `<code>#${esc(link.code)}</code>`}</div>
  <h1>${esc(title)}</h1>
  ${description ? `<p class="desc">${esc(description)}</p>` : ''}
  ${error ? `<div class="err">${ALERT}<span>${esc(error)}</span></div>` : ''}
  ${fixed
    ? `<div class="amount-box"><div class="amount-head"><span>مبلغ قابل پرداخت</span><span class="tag">IRT</span></div>
       <div class="amount">${fa(link.amount)}<small>تومان</small></div><div class="words">${tomanWords(link.amount)}</div></div>`
    : `<div class="field" style="margin-top:20px"><label for="amount">مبلغ <small>حداقل ${fa(MIN_AMOUNT)} تومان</small></label>
       <div class="amount-input"><input class="input" id="amount" name="amount" inputmode="numeric" autocomplete="off" placeholder="۰" value="${esc(values.amount)}" required><span>تومان</span></div>
       <div class="hint" id="words"></div>${chips}</div>`}
  ${home ? noteField : ''}
  <div class="sep"></div>
  <div class="row">
    <div class="field"><label for="name">نام <small>اختیاری</small></label><input class="input" id="name" name="name" maxlength="80" autocomplete="name" value="${esc(values.name)}"></div>
    <div class="field"><label for="phone">موبایل <small>اختیاری</small></label><input class="input mono" id="phone" name="phone" inputmode="tel" maxlength="14" autocomplete="tel" placeholder="09…" dir="ltr" style="text-align:right" value="${esc(values.phone)}"></div>
  </div>
  ${home ? '' : noteField}
  <button class="btn" id="go"><span class="spin"></span><span id="go-t">${fixed ? `پرداخت ${fa(link.amount)} تومان` : 'ادامه و پرداخت'}</span><kbd>↵</kbd></button>
  <div class="secure">${LOCK} اتصال رمزنگاری‌شده به درگاه زرین‌پال</div>
</form>
<script>
const f=document.getElementById('f'),a=document.getElementById('amount'),w=document.getElementById('words'),go=document.getElementById('go'),t=document.getElementById('go-t');
const en=s=>s.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^0-9]/g,'');
const fa=n=>Number(n).toLocaleString('fa-IR');
function words(n){const p=[],b=Math.floor(n/1e9),m=Math.floor(n%1e9/1e6),k=Math.floor(n%1e6/1e3),r=n%1e3;
  if(b)p.push(fa(b)+' میلیارد');if(m)p.push(fa(m)+' میلیون');if(k)p.push(fa(k)+' هزار');if(r)p.push(fa(r));return p.join(' و ')+' تومان'}
if(a){a.addEventListener('input',()=>{const n=Number(en(a.value));a.value=n?fa(n):'';w.textContent=n?words(n):'';w.style.color='';
  t.textContent=n?'پرداخت '+fa(n)+' تومان':'ادامه و پرداخت'});a.dispatchEvent(new Event('input'));if(!a.value)a.focus()}
document.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{a.value=b.dataset.n;a.dispatchEvent(new Event('input'))});
f.addEventListener('submit',e=>{if(a&&Number(en(a.value))<${MIN_AMOUNT}){e.preventDefault();a.focus();w.textContent='حداقل ${fa(MIN_AMOUNT)} تومان';w.style.color='var(--bad)';return}
  go.disabled=true;t.textContent='در حال اتصال به درگاه…'});
</script>`, { route: home ? '' : `p/${link.code}` })
}

export function statePage({ kind, title, text, action = '', route = '' }) {
  return layout(title, `<div class="card state"><div class="badge-ic ${kind}">${ICONS[kind]}</div>
  <h1>${esc(title)}</h1><p class="desc">${esc(text)}</p>${action ? `<div style="margin-top:20px">${action}</div>` : ''}</div>`, { route })
}

export function resultPage(p) {
  if (p.status !== 'paid') {
    return statePage({
      kind: 'bad', title: 'پرداخت انجام نشد', route: 'cb',
      text: 'اگه مبلغی از حسابتون کم شده، حداکثر تا ۷۲ ساعت خودکار برمی‌گرده.',
      action: p.link_code ? `<a class="btn" href="${p.link_code === 'home' ? '/' : `/p/${esc(p.link_code)}`}">تلاش دوباره</a>` : '',
    })
  }
  return layout('پرداخت موفق', `<div class="card state">
  <div class="badge-ic ok">${ICONS.ok}</div>
  <div class="eyebrow" style="justify-content:center">تراکنش تأیید شد</div>
  <h1>${fa(p.amount)} <span style="font-size:15px;font-weight:500;color:var(--muted)">تومان</span></h1>
  <p class="desc">ممنون${p.payer_name ? ` ${esc(p.payer_name)}` : ''}؛ پرداخت به ${esc(OWNER)} با موفقیت انجام شد.</p>
  <div class="receipt">
    ${p.title && p.title !== 'پرداخت مستقیم' ? `<div><span>بابت</span><b>${esc(p.title)}</b></div>` : ''}
    ${p.note ? `<div><span>توضیح</span><b>${esc(p.note)}</b></div>` : ''}
    <div><span>کد پیگیری</span><b><code id="ref">${esc(p.ref_id ?? '-')}</code><button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('ref').textContent);this.textContent='کپی شد'">کپی</button></b></div>
    ${p.card_pan ? `<div><span>کارت</span><b><code>${esc(p.card_pan)}</code></b></div>` : ''}
    <div><span>زمان</span><b>${faDate(p.paid_at)}</b></div>
  </div>
  <div class="actions"><button class="btn ghost" onclick="print()">ذخیره‌ی رسید</button><a class="btn ghost" href="/">پرداخت جدید</a></div></div>`, { route: 'receipt' })
}

export function mockPage(p) {
  return layout('درگاه آزمایشی', `<div class="card state">
  <div class="badge-ic muted">${ICONS.muted}</div><div class="eyebrow" style="justify-content:center">sandbox</div><h1>درگاه آزمایشی</h1>
  <p class="desc">مرچنت زرین‌پال تنظیم نشده؛ پول واقعی جابه‌جا نمی‌شه.</p>
  <div class="amount-box"><div class="amount">${fa(p.amount)}<small>تومان</small></div></div>
  <div class="actions"><a class="btn" href="/cb?Authority=${esc(p.authority)}&Status=OK">پرداخت موفق</a>
  <a class="btn ghost" href="/cb?Authority=${esc(p.authority)}&Status=NOK">انصراف</a></div></div>`, { route: 'mock' })
}
