// Verifies the user's name entered during setup flows through to Home.
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
const clickText = async needle => evalJs(`(() => {
  const n = ${JSON.stringify(needle)}.toLowerCase();
  const el = [...document.querySelectorAll('button, a, [role="button"]')]
    .find(e => e.offsetParent !== null && (e.textContent || '').toLowerCase().includes(n));
  if (!el) return false;
  el.scrollIntoView({ block: 'center' }); el.click(); return true;
})()`)
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

// walk the whole first-run journey, choosing a non-default name/route
await send('Page.navigate', { url: BASE + '/' }); await sleep(1200)
await clickText('CONTINUE'); await sleep(600)
await clickText('Next'); await sleep(500)
await clickText('Next'); await sleep(500)
await clickText('Get started'); await sleep(700)
await evalJs(`(() => { const i = document.querySelector('#phone-amber');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  set.call(i,'98765 43210'); i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
await sleep(300)
await clickText('SEND CODE'); await sleep(700)
await evalJs(`(() => { const ins=[...document.querySelectorAll('input[aria-label^="OTP digit"]')];
  const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  ins.forEach((x,i)=>{set.call(x,String(i+1));x.dispatchEvent(new Event('input',{bubbles:true}));}); })()`)
await sleep(300)
await clickText('Verify and continue'); await sleep(700)
await clickText('Allow location'); await sleep(800)

// journey step: custom name + Central line
await evalJs(`(() => { const i = document.querySelector('input[placeholder="Your name"]');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  set.call(i,'Meera Kulkarni'); i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
await sleep(250)
await clickText('CENTRAL'); await sleep(400)
await shot('flow-setup-journey')
await clickText('CONTINUE'); await sleep(700)
await shot('flow-setup-about')
await clickText('Save and start'); await sleep(1600)
await shot('flow-home-named')

const homeText = await evalJs('document.body.innerText.slice(0, 200)')
console.log('HOME TEXT:', JSON.stringify(homeText))
const stored = await evalJs('localStorage.getItem("saath.state.v1")')
console.log('STORED:', stored)

// amber loading state (first load of a session) should show the same name
await evalJs('sessionStorage.clear()')
await send('Page.navigate', { url: BASE + '/home' }); await sleep(400)
await shot('flow-home-amber-named')
const amberText = await evalJs('document.body.innerText.slice(0, 120)')
console.log('AMBER TEXT:', JSON.stringify(amberText))

ws.close()
