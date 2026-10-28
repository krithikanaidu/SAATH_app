// Quick visual pass over the first-run journey (S01 → S04) at 390×844.
// usage: node tests/shots.mjs [baseUrl]
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT = fileURLToPath(new URL('./out/', import.meta.url))
await mkdir(OUT, { recursive: true })

const tab = await fetch(`http://127.0.0.1:9333/json/new?${encodeURIComponent(BASE + '/')}`, { method: 'PUT' }).then(r => r.json())
const ws = new WebSocket(tab.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const send = (method, params = {}) => {
  const msgId = ++id
  ws.send(JSON.stringify({ id: msgId, method, params }))
  return new Promise(res => pending.set(msgId, res))
}
ws.onmessage = ev => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
const evalJs = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value
async function shot(name) {
  const s = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(`${OUT}/${name}.png`, Buffer.from(s.data, 'base64'))
  console.log('shot', name)
}
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')) })
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await send('Page.navigate', { url: BASE + '/' })
await sleep(1500)
await evalJs('localStorage.clear()')

for (const [name, url] of [
  ['v2-s01-splash', '/'],
  ['v2-s02-onboarding', '/onboarding'],
  ['v2-s03-phone', '/signup'],
  ['v2-s04-journey', '/setup'],
]) {
  await send('Page.navigate', { url: BASE + url })
  await sleep(1600)
  await shot(name)
}

// S04b: continue from the journey step
await send('Page.navigate', { url: BASE + '/setup' })
await sleep(1600)
await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('CONTINUE'))?.click()`)
await sleep(700)
await shot('v2-s04b-about')

ws.close()
