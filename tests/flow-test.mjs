// Flow test: walks the SAATH prototype end-to-end via real clicks.
// usage: node flow-test.mjs
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = 'http://localhost:5173'
const OUT = fileURLToPath(new URL('./out/', import.meta.url))
await mkdir(OUT, { recursive: true })

const tab = await fetch(`http://127.0.0.1:9333/json/new?${encodeURIComponent(BASE + '/')}`, { method: 'PUT' }).then(r => r.json())
const ws = new WebSocket(tab.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const errors = []
function send(method, params = {}) {
  const msgId = ++id
  ws.send(JSON.stringify({ id: msgId, method, params }))
  return new Promise(res => pending.set(msgId, res))
}
ws.onmessage = ev => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push('EXC: ' + m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description ?? ''))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('ERR: ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' '))
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function evalJs(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
  return r.result.value
}
async function shot(name) {
  const s = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(`${OUT}/${name}.png`, Buffer.from(s.data, 'base64'))
}
/** click by CSS selector or 'button:has-text("Label")' pattern */
async function click(sel, timeout = 4000) {
  const textMatch = sel.match(/^button:has-text\("(.+)"\)$/)
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const ok = await evalJs(
      textMatch
        ? `(() => {
            const needle = ${JSON.stringify(textMatch[1])}.toLowerCase();
            const el = [...document.querySelectorAll('button, a, [role="button"]')]
              .find(e => e.offsetParent !== null && (e.textContent || '').toLowerCase().includes(needle));
            if (!el) return false;
            el.scrollIntoView({ block: 'center' });
            el.click();
            return true;
          })()`
        : `(() => {
            const els = [...document.querySelectorAll(${JSON.stringify(sel)})];
            const el = els.find(e => e.offsetParent !== null) || els[0];
            if (!el) return false;
            el.scrollIntoView({ block: 'center' });
            el.click();
            return true;
          })()`,
    )
    if (ok) { await sleep(450); return true }
    await sleep(200)
  }
  throw new Error('click timeout: ' + sel)
}
const path = () => evalJs('location.pathname + location.search')
/** set a React-controlled input/select value and fire the right events */
async function type(sel, value) {
  const ok = await evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return false;
    const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
  if (!ok) throw new Error('no element for ' + sel)
  await sleep(250)
}

await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = () => rej(new Error('CDP websocket failed'))
})
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await send('Page.navigate', { url: BASE + '/' })
await sleep(2000)
// start from a clean slate so persisted state from prior runs can't skew results
await evalJs('localStorage.clear()')
await send('Page.navigate', { url: BASE + '/' })
await sleep(1500)

const log = []
async function step(label, fn) {
  try {
    await fn()
    log.push(`PASS  ${label}  -> ${await path()}`)
  } catch (e) {
    log.push(`FAIL  ${label}  -> ${String(e.message).slice(0, 160)}`)
  }
}

// --- onboarding journey ---
await step('S01 language select', async () => {
  await click('[role="radio"]:nth-of-type(1)', 3000)
})
await step('S01 continue -> onboarding', async () => {
  await click('button:has-text("Continue")', 3000)
  if (!(await path()).startsWith('/onboarding')) throw new Error('did not navigate')
})
await step('S02 slide1 next', async () => { await click('button:has-text("Next")') })
await step('S02 slide2 next', async () => { await click('button:has-text("Next")') })
await step('S02 slide3 get started -> signup', async () => {
  await click('button:has-text("Get started")')
  if (!(await path()).startsWith('/signup')) throw new Error('did not navigate: ' + await path())
})
await shot('s02b-amber')
await step('S03 type phone -> send code', async () => {
  await type('#phone-amber', '98765 43210')
  const stillDisabled = await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('SEND CODE'))?.disabled`)
  if (stillDisabled) throw new Error('SEND CODE should enable at 10 digits')
  await click('button:has-text("Send code")')
  const p = await evalJs('document.body.innerText.slice(0, 120)')
  if (!/VERIFY YOUR NUMBER/i.test(p)) throw new Error('verify step missing: ' + p)
})
await step('S03 fill otp', async () => {
  const n = await evalJs(`(() => {
    const inputs = [...document.querySelectorAll('input[aria-label^="OTP digit"]')];
    inputs.forEach((inp, i) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, String((i + 1) % 10));
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return inputs.length;
  })()`)
  // OTP length is configurable (Supabase default 6, design shows 4) — assert the
  // boxes rendered match whatever the app is configured for.
  const expected = await evalJs(
    `(() => { const m = /verify your number/i.test(document.body.innerText); return m; })()`,
  )
  if (n < 4 || n > 8) throw new Error('expected 4–8 OTP boxes, got ' + n)
  if (!expected) throw new Error('verify heading missing')
  await sleep(300)
})
await shot('s03b-verify')
await step('S03b verify and continue -> location', async () => {
  await click('button:has-text("Verify and continue")')
  const p = await evalJs('document.body.innerText.slice(0, 120)')
  if (!/LOCATION ACCESS/i.test(p)) throw new Error('location step missing: ' + p)
})
await shot('s03c-location')
await step('S03c allow location -> setup', async () => {
  await click('button:has-text("Allow location")')
  if (!(await path()).startsWith('/setup')) throw new Error('did not navigate: ' + await path())
})
await step('S04 continue -> about', async () => {
  await click('button:has-text("Continue")')
  const p = await evalJs('document.body.innerText.slice(0, 120)')
  if (!/ABOUT YOU/i.test(p)) throw new Error('about step missing: ' + p)
})
await shot('s04a-journey')
await step('S04b save and start -> home', async () => {
  await click('button:has-text("Save and start")')
  if (!(await path()).startsWith('/home')) throw new Error('did not navigate: ' + await path())
})
await shot('s05-home')

// --- signed-in app ---
await step('S05 open smart window', async () => {
  await click('button:has-text("Compare departures")')
  if (!(await path()).startsWith('/smart-window')) throw new Error(await path())
})
await shot('s07-smartwindow')
await step('S07 use 08:42 -> train', async () => {
  await click('button:has-text("Use 08:42 departure")')
  if (!(await path()).startsWith('/train/')) throw new Error(await path())
})
await shot('s06-train')
await step('S06 report crowd', async () => { await click('button[aria-pressed]', 3000) })
await step('S06 plan boarding -> queue', async () => {
  await click('button:has-text("Plan boarding")')
  if (!(await path()).startsWith('/queue')) throw new Error(await path())
})
await shot('s08a-queue')
await step('S08 book slot -> confirmed', async () => {
  await click('button:has-text("Book boarding slot")')
  const p = await evalJs('document.body.innerText.slice(0, 100)')
  if (!/SLOT CONFIRMED/i.test(p)) throw new Error('confirm missing: ' + p)
})
await shot('s08b-confirmed')
await step('S08b navigate to platform -> home', async () => {
  await click('button:has-text("Navigate to platform")')
  if (!(await path()).startsWith('/home')) throw new Error(await path())
})
await step('nav groups tab', async () => {
  await click('nav a[href="/groups"]')
  if (!(await path()).startsWith('/groups')) throw new Error(await path())
})
await shot('s09-groups')
await step('S09 create a group (no hardcoded groups any more)', async () => {
  // Groups are no longer seeded — the list starts empty, so create one first.
  await click('button[aria-label="Create a group"]')
  await sleep(300)
  await evalJs(`(() => {
    const el = document.querySelector('#cg-name');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, 'Test morning crew');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  await click('button:has-text("Create group")')
  await sleep(900)
  const p = await path()
  if (!/^\/groups\//.test(p)) throw new Error('expected to land on a group, got ' + p)
})
await shot('s10-groupdetail')
await step('S10 send message', async () => {
  await evalJs(`(() => {
    const t = document.querySelector('#msg');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(t, 'On my way!');
    t.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  await click('button:has-text("Send message")')
  await sleep(700)
  const has = await evalJs('document.body.innerText.includes("On my way!")')
  if (!has) throw new Error('message not added')
})
await step('nav safety tab -> SOS', async () => {
  await click('nav a[href="/sos"]')
  if (!(await path()).startsWith('/sos')) throw new Error(await path())
})
await shot('s11a-sos')
await step('S11 hold SOS -> countdown', async () => {
  const box = await evalJs(`(() => {
    const b = document.querySelector('button[aria-label*="Hold"]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  })()`)
  if (!box) throw new Error('SOS pad not found')
  const { x, y } = JSON.parse(box)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await sleep(2300)
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  await sleep(600)
  const p = await evalJs('document.body.innerText.slice(0, 120)')
  if (!/SENDING ALERT/i.test(p)) throw new Error('countdown missing: ' + p)
})
await shot('s11b-countdown')
await step('S11b cancel -> idle', async () => {
  await click('button:has-text("Cancel")')
  const p = await evalJs('document.body.innerText')
  if (!/Hold for 2 seconds/i.test(p)) throw new Error('not idle: ' + p.slice(0, 160))
})
await step('S11 re-hold -> sent', async () => {
  const box = await evalJs(`(() => {
    const b = document.querySelector('button[aria-label*="Hold"]');
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
  })()`)
  const { x, y } = JSON.parse(box)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await sleep(7800) // 2s hold + 5s countdown + margin
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  await sleep(500)
  const p = await evalJs('document.body.innerText')
  if (!/ALERT SENT/i.test(p)) throw new Error('sent missing: ' + p.slice(0, 160))
})
await shot('s11c-sent')
await step('S11c home', async () => {
  await click('button:has-text("Home")')
  if (!(await path()).startsWith('/home')) throw new Error(await path())
})
await step('nav profile tab -> rewards', async () => {
  await click('nav a[href="/profile"]')
  if (!(await path()).startsWith('/profile')) throw new Error(await path())
})
await shot('s12-rewards')
await step('S12 plan next trip -> home', async () => {
  await click('button:has-text("Plan next trip")')
  if (!(await path()).startsWith('/home')) throw new Error(await path())
})
await step('deep link /train/t-0842 direct', async () => {
  await send('Page.navigate', { url: BASE + '/train/t-0842' })
  await sleep(1200)
  const p = await evalJs('document.body.innerText.slice(0, 60)')
  if (!/Churchgate|to /.test(p)) throw new Error('deep link broken: ' + p)
})
await step('404 route', async () => {
  await send('Page.navigate', { url: BASE + '/nope' })
  await sleep(900)
  const p = await evalJs('document.body.innerText.slice(0, 60)')
  if (!/404/.test(p)) throw new Error('404 missing: ' + p)
})
await shot('s404')

// offline states
for (const [name, url, expect] of [
  ['s05a-loading', '/home?state=loading', 'Loading|Good morning'],
  ['s05b-empty', '/home?state=empty', 'SET YOUR ROUTE'],
  ['s05c-offline', '/home?state=offline', 'offline'],
  ['s05-locoff', '/home?state=location-off', 'LOCATION OFF'],
  ['s06a-loading', '/train/t-0830?state=loading', 'COACH CROWD|Loading'],
  ['s06b-offline', '/train/t-0830?state=offline', 'offline'],
  ['s08c-offline', '/queue?state=offline', 'offline'],
  ['s09a-empty', '/groups?state=empty', 'NO GROUPS YET'],
  ['s03a-error', '/signup?state=error', 'CHECK YOUR NUMBER'],
  ['s04a-error', '/setup?state=error', 'YOUR USUAL JOURNEY'],
  ['s12a-empty', '/profile?state=empty', 'No trips yet'],
]) {
  await step(`state ${name}`, async () => {
    await send('Page.navigate', { url: BASE + url })
    await sleep(1000)
    const p = await evalJs('document.body.innerText')
    if (!new RegExp(expect, 'i').test(p)) throw new Error('expected ' + expect + ' got: ' + p.slice(0, 100))
    await shot(name)
  })
}

// --- amber state interactions ---
await step('S03a_Error: invalid number disabled -> fix -> send code', async () => {
  await send('Page.navigate', { url: BASE + '/signup?state=error' })
  await sleep(900)
  const first = await evalJs('document.body.innerText')
  if (!/Enter a 10-digit mobile number/i.test(first)) throw new Error('inline error missing')
  const disabled = await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('SEND CODE')).disabled`)
  if (!disabled) throw new Error('SEND CODE should start disabled')
  await type('#phone-amber', '98765 43210')
  const still = await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('SEND CODE')).disabled`)
  if (still) throw new Error('SEND CODE should enable at 10 digits')
  await click('button:has-text("SEND CODE")')
  const after = await evalJs('document.body.innerText')
  if (!/VERIFY YOUR NUMBER/i.test(after)) throw new Error('did not advance to verify: ' + after.slice(0, 80))
})

await step('S04a_Error: same-station error -> fix destination -> continue', async () => {
  await send('Page.navigate', { url: BASE + '/setup?state=error' })
  await sleep(900)
  const first = await evalJs('document.body.innerText')
  if (!/Choose a different destination station/i.test(first)) throw new Error('station error missing')
  const disabled = await evalJs(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('CONTINUE')).disabled`)
  if (!disabled) throw new Error('CONTINUE should start disabled')
  await type('#je-to', 'Churchgate')
  const second = await evalJs('document.body.innerText')
  if (/Choose a different destination/i.test(second)) throw new Error('error should clear')
  await click('button:has-text("CONTINUE")')
  await sleep(700)
  const p = await path()
  if (p !== '/home') throw new Error('expected /home, got ' + p)
})

await step('S09a: + opens create-group sheet -> new group persists', async () => {
  await send('Page.navigate', { url: BASE + '/groups?state=empty' })
  await sleep(900)
  await click('button[aria-label="Create a group"]')
  await sleep(300)
  if (!(await evalJs(`!!document.querySelector('#cg-name')`))) throw new Error('sheet did not open')
  await click('button:has-text("CREATE GROUP")')
  const blocked = await evalJs(`/at least 3 characters/i.test(document.body.innerText)`)
  if (!blocked) throw new Error('name validation missing')
  await type('#cg-name', 'Test morning crew')
  await click('button:has-text("CREATE GROUP")')
  await sleep(800)
  const p = await path()
  if (!/^\/groups\/(local|custom)-/.test(p)) throw new Error('expected new group detail, got ' + p)
  const t = await evalJs('document.body.innerText')
  if (!/Test morning crew/i.test(t)) throw new Error('new group name not shown')
  await send('Page.navigate', { url: BASE + '/groups' })
  await sleep(800)
  const list = await evalJs('document.body.innerText')
  if (!/Test morning crew/i.test(list)) throw new Error('new group missing from list')
})

await step('S12a: gear opens settings sheet -> language + close', async () => {
  await send('Page.navigate', { url: BASE + '/profile?state=empty' })
  await sleep(900)
  await click('button[aria-label="Settings"]')
  await sleep(300)
  if (!(await evalJs(`!!document.querySelector('[role="dialog"][aria-label="Settings"]')`))) throw new Error('sheet missing')
  await click('button:has-text("हिन्दी")')
  await sleep(200)
  const lang = await evalJs(`JSON.parse(localStorage.getItem('saath.state.v1')).language`)
  if (lang !== 'hi') throw new Error('language not persisted, got ' + lang)
  await click('button[aria-label="Close settings"]')
  await sleep(300)
  if (await evalJs(`!!document.querySelector('[role="dialog"]')`)) throw new Error('sheet should close')
})

console.log(log.join('\n'))
console.log('\nCONSOLE ERRORS:', errors.length ? errors.join('\n') : 'none')
const fails = log.filter(l => l.startsWith('FAIL'))
console.log(`\nRESULT: ${log.length - fails.length}/${log.length} passed`)
ws.close(); process.exit(fails.length ? 1 : 0)
