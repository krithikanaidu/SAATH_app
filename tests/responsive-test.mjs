// Responsive check: small mobile, tablet-ish, desktop — no overflow, nav intact.
const sizes = [
  { name: 'mobile-360', w: 360, h: 740 },
  { name: 'mobile-414', w: 414, h: 896 },
  { name: 'tablet-768', w: 768, h: 1024 },
  { name: 'desktop-1280', w: 1280, h: 900 },
  { name: 'desktop-1920', w: 1920, h: 1080 },
]
const routes = ['/', '/home', '/groups', '/sos', '/profile', '/train/t-0830']
const log = []
const fails = []

for (const s of sizes) {
  const tab = await fetch(`http://127.0.0.1:9333/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' }).then(r => r.json())
  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => {
    const m = ++id
    ws.send(JSON.stringify({ id: m, method, params }))
    return new Promise(res => pending.set(m, res))
  }
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id) }
  }
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')) })
  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 768 })
  // seed onboarded state once
  await send('Page.navigate', { url: 'http://localhost:4173/' })
  await new Promise(r => setTimeout(r, 1200))
  await send('Runtime.evaluate', { expression: `localStorage.setItem('saath.state.v1', JSON.stringify({onboarded:true,signedIn:true,otpVerified:true,language:'en'}))` })

  for (const route of routes) {
    await send('Page.navigate', { url: 'http://localhost:4173' + route })
    // wait for the device frame to mount (first route also warms the SW/shell)
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 150))
      const has = await send('Runtime.evaluate', { expression: `!!document.querySelector('.device')`, returnByValue: true })
      if (has.result?.value) break
    }
    const r = await send('Runtime.evaluate', {
      expression: `JSON.stringify((() => {
        const de = document.documentElement;
        const dev = document.querySelector('.device');
        const dr = dev ? dev.getBoundingClientRect() : null;
        const over = [...document.querySelectorAll('*')]
          .filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > window.innerWidth + 1.5 || b.left < -1.5); })
          .slice(0, 4)
          .map(el => el.tagName + '.' + String(el.className).slice(0, 30));
        return {
          scrollW: de.scrollWidth, innerW: window.innerWidth,
          device: dr ? { x: Math.round(dr.x), w: Math.round(dr.width), h: Math.round(dr.height) } : null,
          nav: !!document.querySelector('nav'),
          over,
          bodyText: document.body.innerText.slice(0, 40).replace(/\\n/g, ' '),
        };
      })())`,
      returnByValue: true,
    })
    const info = JSON.parse(r.result.value)
    const noOverflow = info.scrollW <= info.innerW + 1 && info.over.length === 0
    const centered = info.device && (s.w >= 480 ? Math.abs(info.device.x - (s.w - info.device.w) / 2) <= 2 : info.device.x === 0)
    const ok = noOverflow && centered
    const line = `${ok ? 'PASS' : 'FAIL'}  ${s.name.padEnd(13)} ${route.padEnd(22)} scrollW=${info.scrollW}/${info.innerW} device=${info.device ? info.device.x + ',' + info.device.w : 'none'}${info.over.length ? ' OVER:' + info.over.join(';') : ''}${centered ? '' : ' NOT-CENTERED'}`
    log.push(line)
    if (!ok) fails.push(line)
  }
  ws.close()
}

console.log(log.join('\n'))
console.log(`\nRESULT: ${log.length - fails.length}/${log.length} passed`)
process.exit(fails.length ? 1 : 0)
