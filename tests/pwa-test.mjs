// PWA verification against the production build (vite preview @4173).
import { readFile } from 'node:fs/promises'

const BASE = 'http://localhost:4173'
const log = []
const check = (name, ok, detail = '') =>
  log.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)

const tab = await fetch(`http://127.0.0.1:9333/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' }).then(r => r.json())
const ws = new WebSocket(tab.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const consoleErrors = []
function send(method, params = {}) {
  const msgId = ++id
  ws.send(JSON.stringify({ id: msgId, method, params }))
  return new Promise(res => pending.set(msgId, res))
}
ws.onmessage = ev => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') consoleErrors.push('EXC ' + m.params.exceptionDetails.text)
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
    consoleErrors.push('ERR ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' '))
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function js(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 200))
  return r.result.value
}

await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')) })
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })

/* ---------- 1. manifest served + valid ---------- */
const mf = await fetch(BASE + '/manifest.webmanifest')
check('manifest.webmanifest served', mf.ok, `HTTP ${mf.status}`)
const manifest = await mf.json()
check('manifest: name present', !!manifest.name, manifest.name)
check('manifest: short_name present', !!manifest.short_name, manifest.short_name)
check('manifest: start_url', !!manifest.start_url, manifest.start_url)
check('manifest: display standalone', manifest.display === 'standalone', manifest.display)
check('manifest: theme_color', !!manifest.theme_color, manifest.theme_color)
check('manifest: background_color', !!manifest.background_color, manifest.background_color)
check('manifest: icons declared', Array.isArray(manifest.icons) && manifest.icons.length >= 3, `${manifest.icons?.length} icons`)

/* ---------- 2. icons exist at required sizes ---------- */
async function pngSize(path) {
  const r = await fetch(BASE + path)
  if (!r.ok) return null
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), bytes: buf.length }
}
for (const [path, want] of [
  ['/icons/icon-192.png', 192],
  ['/icons/icon-512.png', 512],
  ['/icons/icon-maskable-512.png', 512],
  ['/icons/apple-touch-icon.png', 180],
]) {
  const s = await pngSize(path)
  check(`icon ${path}`, !!s && s.w === want && s.h === want, s ? `${s.w}x${s.h}, ${s.bytes}B` : 'missing/invalid')
}
for (const icon of manifest.icons) {
  const s = await pngSize(icon.src)
  check(`manifest icon ${icon.src}`, !!s, `${icon.sizes} ${s ? 'ok' : 'MISSING'}`)
}

/* ---------- 3. service worker registers + activates ---------- */
await send('Page.navigate', { url: BASE + '/' })
await sleep(2500)
const sw = await js(`(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return JSON.stringify({ registered: false });
  // wait for activation
  const active = reg.active || await new Promise(res => {
    if (reg.installing) reg.installing.addEventListener('statechange', e => { if (e.target.state === 'activated') res(e.target); });
    setTimeout(() => res(reg.active), 4000);
  });
  return JSON.stringify({
    registered: true,
    scope: reg.scope,
    state: active ? active.state : null,
    scriptURL: active ? active.scriptURL : null,
  });
})()`)
const swInfo = JSON.parse(sw)
check('service worker registered', swInfo.registered === true)
check('service worker activated', swInfo.state === 'activated', `state=${swInfo.state}`)
check('service worker scope is root', swInfo.scope === BASE + '/', swInfo.scope)
check('service worker served from /sw.js', (swInfo.scriptURL || '').endsWith('/sw.js'), swInfo.scriptURL)

/* ---------- 4. app-shell + fonts precached ---------- */
const cachesJs = await js(`(async () => {
  const keys = await caches.keys();
  const out = { keys, shell: [], assets: [] };
  for (const k of keys) {
    const c = await caches.open(k);
    const reqs = await c.keys();
    const paths = reqs.map(r => new URL(r.url).pathname);
    if (k.includes('shell')) out.shell = paths;
    if (k.includes('assets')) out.assets = paths;
  }
  return JSON.stringify(out);
})()`)
const cacheInfo = JSON.parse(cachesJs)
check('cache versioned + old caches purged', cacheInfo.keys.every(k => k.startsWith('saath-v1')), cacheInfo.keys.join(', '))
const need = ['/index.html', '/manifest.webmanifest', '/fonts/inter-latin-var.woff2', '/fonts/bebas-neue-latin.woff2', '/fonts/noto-devanagari-var.woff2']
for (const p of need) check(`precache ${p}`, cacheInfo.shell.includes(p), cacheInfo.shell.join(' '))

/* ---------- 5. no sensitive data cached ---------- */
const allCached = [...cacheInfo.shell, ...cacheInfo.assets]
check('no /api/ responses cached', !allCached.some(p => p.startsWith('/api/')), `${allCached.length} entries, all static`)

/* ---------- 6. deep link + refresh on a nested route ---------- */
// seed an onboarded profile so the onboarding gate doesn't redirect
await send('Page.navigate', { url: BASE + '/' })
await sleep(1200)
await js(`localStorage.setItem('saath.state.v1', JSON.stringify({ onboarded: true, signedIn: true, otpVerified: true, language: 'en' }))`)
await send('Page.navigate', { url: BASE + '/groups/western-morning-buddies' })
await sleep(1800)
const deep = await js(`JSON.stringify({ path: location.pathname, hasNav: !!document.querySelector('nav'), text: document.body.innerText.slice(0, 60) })`)
const deepInfo = JSON.parse(deep)
check('deep link /groups/:id renders (no 404)', deepInfo.path === '/groups/western-morning-buddies' && deepInfo.hasNav, deepInfo.text.replace(/\n/g, ' '))
await send('Page.reload', {})
await sleep(1500)
const afterReload = await js(`location.pathname + '|' + !!document.querySelector('nav')`)
check('refresh on deep route keeps working', afterReload === '/groups/western-morning-buddies|true', afterReload)

/* ---------- 7. offline fallback via service worker ---------- */
await send('Network.enable')
await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
await send('Page.navigate', { url: BASE + '/profile' })
await sleep(2500)
const offline = await js(`JSON.stringify({ path: location.pathname, hasApp: document.body.innerText.includes('trip') || document.body.innerText.includes('Sign') || document.body.innerText.length > 100, len: document.body.innerText.length })`)
const offInfo = JSON.parse(offline)
check('offline: navigation falls back to cached shell', offInfo.hasApp && offInfo.path === '/profile', `path=${offInfo.path} textLen=${offInfo.len}`)
// fonts still available offline?
const offlineFonts = await js(`(async () => { await document.fonts.ready; return JSON.stringify({ inter: document.fonts.check('400 16px Inter') }); })()`)
check('offline: fonts render from cache', JSON.parse(offlineFonts).inter === true)
await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
await sleep(500)

/* ---------- 8. update safety: new deploy replaces old caches ---------- */
const cacheVersion = await js(`caches.keys()`)
const saathCaches = Array.isArray(cacheVersion) ? cacheVersion : JSON.parse(cacheVersion)
// one VERSION prefix (shell + assets buckets) and nothing from older deploys
const versions = new Set(saathCaches.filter(k => k.startsWith('saath-')).map(k => k.split('-').slice(0, 2).join('-')))
check('single cache version across buckets (updates safe)', versions.size === 1 && [...versions][0] === 'saath-v1', saathCaches.join(', '))

/* ---------- 9. installability signals ---------- */
const installable = await js(`JSON.stringify({
  hasManifestLink: !!document.querySelector('link[rel="manifest"]'),
  manifestHref: document.querySelector('link[rel="manifest"]')?.href,
  themeColor: document.querySelector('meta[name="theme-color"]')?.content,
  viewport: document.querySelector('meta[name="viewport"]')?.content,
  appleIcon: !!document.querySelector('link[rel="apple-touch-icon"]'),
  standalone: window.matchMedia('(display-mode: standalone)').matches,
})`)
const inst = JSON.parse(installable)
check('index.html links manifest', inst.hasManifestLink, inst.manifestHref)
check('theme-color meta present', !!inst.themeColor, inst.themeColor)
check('viewport meta mobile-ready', /width=device-width/.test(inst.viewport || ''), inst.viewport)
check('apple-touch-icon present', inst.appleIcon)

console.log(log.join('\n'))
console.log('\nCONSOLE ERRORS: ' + (consoleErrors.length ? consoleErrors.join('\n') : 'none'))
const fails = log.filter(l => l.startsWith('FAIL'))
console.log(`\nRESULT: ${log.length - fails.length}/${log.length} passed`)
ws.close()
process.exit(fails.length ? 1 : 0)
