/**
 * Stop Uptime Kuma emailing on one-off blips.
 *
 * Uptime Kuma's defaults are Retries 0 and a 48 s request timeout (80% of the
 * 60 s interval), so a single probe that stalls — a cold Lambda, a CloudFront
 * hiccup, a DNS stall in the NAS's Docker network — sends "[🔴 Down] timeout
 * of 48000ms exceeded" and then "[✅ Up]" a minute later. This sets Retries,
 * the retry interval and the request timeout on one monitor so the site has to
 * stay unreachable for a few checks in a row before anyone is emailed.
 *
 * Uptime Kuma has no REST API for monitor settings; this talks to the same
 * socket.io API its web UI uses, so run it from a machine that can open the
 * dashboard (the tailnet is fine).
 *
 *   npm install --no-save socket.io-client
 *   KUMA_URL=http://nas:3001 KUMA_USERNAME=admin KUMA_PASSWORD=... \
 *     node scripts/uptime-kuma-retries.mjs --monitor "Math with Melinda"
 *
 * Options (defaults shown):
 *   --monitor <name>        monitor to edit (exact name; required)
 *   --retries 3             consecutive failed checks before DOWN is declared
 *   --retry-interval 30     seconds between those retries
 *   --timeout 60            request timeout in seconds
 *   --dry-run               show the change without saving it
 * KUMA_TOTP=123456 if the account has two-factor auth turned on.
 * The password is read from the environment, never from a flag, so it does
 * not land in shell history.
 */

import { createRequire } from 'node:module'

const args = process.argv.slice(2)
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return fallback
  return args[i + 1]
}
const dryRun = args.includes('--dry-run')
const monitorName = flag('monitor')
const retries = Number(flag('retries', '3'))
const retryInterval = Number(flag('retry-interval', '30'))
const timeout = Number(flag('timeout', '60'))

const { KUMA_URL, KUMA_USERNAME, KUMA_PASSWORD, KUMA_TOTP } = process.env

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

if (!monitorName) fail('--monitor <name> is required (the name shown in the Uptime Kuma sidebar)')
if (!KUMA_URL || !KUMA_USERNAME || !KUMA_PASSWORD) {
  fail('set KUMA_URL, KUMA_USERNAME and KUMA_PASSWORD in the environment')
}
for (const [label, n] of [['retries', retries], ['retry-interval', retryInterval], ['timeout', timeout]]) {
  if (!Number.isInteger(n) || n < 0) fail(`--${label} must be a whole number of seconds`)
}

let io
try {
  io = createRequire(import.meta.url)('socket.io-client').io
} catch {
  fail('socket.io-client is not installed. Run: npm install --no-save socket.io-client')
}

const socket = io(KUMA_URL.replace(/\/$/, ''), {
  transports: ['websocket'],
  reconnection: false,
  timeout: 10_000,
})

const monitorList = new Promise((resolve) => socket.once('monitorList', resolve))

function emit(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => (res?.ok ? resolve(res) : reject(new Error(res?.msg || `${event} failed`))))
  })
}

const bail = setTimeout(() => fail(`no answer from ${KUMA_URL} after 30 s — is the URL right and reachable from here?`), 30_000)

socket.on('connect_error', (err) => fail(`could not connect to ${KUMA_URL}: ${err.message}`))

socket.on('connect', async () => {
  try {
    await emit('login', { username: KUMA_USERNAME, password: KUMA_PASSWORD, token: KUMA_TOTP })
    const list = await monitorList
    const monitors = Object.values(list)
    const monitor = monitors.find((m) => m.name === monitorName)
    if (!monitor) {
      fail(`no monitor named "${monitorName}". Monitors here: ${monitors.map((m) => `"${m.name}"`).join(', ') || '(none)'}`)
    }

    console.log(`Monitor "${monitor.name}" (${monitor.type} ${monitor.url ?? monitor.hostname ?? ''})`)
    console.log(`  check interval  ${monitor.interval}s`)
    console.log(`  retries         ${monitor.maxretries} → ${retries}`)
    console.log(`  retry interval  ${monitor.retryInterval}s → ${retryInterval}s`)
    console.log(`  request timeout ${monitor.timeout}s → ${timeout}s`)
    console.log(`  → emails only after ${retries + 1} failed checks in a row (~${retries * retryInterval}s after the first failure)`)

    if (dryRun) {
      console.log('dry run: nothing saved')
    } else {
      // editMonitor expects the whole monitor object (it copies every field it
      // knows about from the payload), so send what the server gave us back
      // with just these three fields changed.
      await emit('editMonitor', { ...monitor, maxretries: retries, retryInterval, timeout })
      console.log('✓ saved')
    }
    clearTimeout(bail)
    socket.close()
    process.exit(0)
  } catch (err) {
    fail(err.message)
  }
})
