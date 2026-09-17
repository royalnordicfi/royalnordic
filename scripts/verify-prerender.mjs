/**
 * Fails the build if prerendered money-page HTML drifts from the current Vite asset hashes.
 * Catches the production class of bug where committed/stale northern-lights-tour.html
 * references a deleted hashed JS bundle and hard-loads to a blank screen.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')

function extractAssets(html) {
  const js = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
  const css = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1])
  return { js, css }
}

function assertFileExists(relPath) {
  const abs = path.join(distDir, relPath.replace(/^\//, ''))
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing built asset referenced by HTML: ${relPath}`)
  }
  const size = fs.statSync(abs).size
  if (size < 1000) {
    throw new Error(`Asset too small (likely HTML fallback, not JS/CSS): ${relPath} (${size} bytes)`)
  }
}

function main() {
  const indexPath = path.join(distDir, 'index.html')
  const moneyPath = path.join(distDir, 'northern-lights-tour.html')

  if (!fs.existsSync(indexPath)) {
    console.error('verify-prerender: dist/index.html missing')
    process.exit(1)
  }
  if (!fs.existsSync(moneyPath)) {
    console.error('verify-prerender: dist/northern-lights-tour.html missing — run prerender first')
    process.exit(1)
  }

  const indexHtml = fs.readFileSync(indexPath, 'utf8')
  const moneyHtml = fs.readFileSync(moneyPath, 'utf8')
  const indexAssets = extractAssets(indexHtml)
  const moneyAssets = extractAssets(moneyHtml)

  if (!indexAssets.js.length) {
    throw new Error('verify-prerender: index.html has no /assets/*.js script')
  }
  if (JSON.stringify(indexAssets.js) !== JSON.stringify(moneyAssets.js)) {
    throw new Error(
      `verify-prerender: JS asset mismatch\n  index: ${indexAssets.js.join(', ')}\n  money: ${moneyAssets.js.join(', ')}`
    )
  }
  if (JSON.stringify(indexAssets.css) !== JSON.stringify(moneyAssets.css)) {
    throw new Error(
      `verify-prerender: CSS asset mismatch\n  index: ${indexAssets.css.join(', ')}\n  money: ${moneyAssets.css.join(', ')}`
    )
  }

  for (const asset of [...moneyAssets.js, ...moneyAssets.css]) {
    assertFileExists(asset)
  }

  const required = [
    'Guaranteed Northern Lights Tour Rovaniemi',
    'rel="canonical" href="https://royalnordic.fi/northern-lights-tour"',
    'jsonld-product',
    '"@type": "Product"',
    'prerender-nl-landmark',
  ]
  if (moneyHtml.includes('rel="canonical" href="https://royalnordic.fi/"')) {
    throw new Error(
      'verify-prerender: money HTML still has homepage canonical — prerender did not run'
    )
  }
  if (moneyHtml.includes('<title>Royal Nordic | Lavish Experiences')) {
    throw new Error(
      'verify-prerender: money HTML still has homepage title — prerender did not run'
    )
  }
  for (const needle of required) {
    if (!moneyHtml.includes(needle)) {
      throw new Error(`verify-prerender: money HTML missing required signal: ${needle}`)
    }
  }

  // Guard against shipping a committed public/ copy that can poison Vercel packaging
  // with stale hashes from a previous build. public/ copy is regenerated each build;
  // if present, it must match dist.
  const publicMoney = path.join(root, 'public', 'northern-lights-tour.html')
  if (fs.existsSync(publicMoney)) {
    const publicHtml = fs.readFileSync(publicMoney, 'utf8')
    const publicAssets = extractAssets(publicHtml)
    if (JSON.stringify(publicAssets.js) !== JSON.stringify(indexAssets.js)) {
      throw new Error(
        'verify-prerender: public/northern-lights-tour.html JS hashes differ from dist/index.html — regenerate via prerender; do not commit stale HTML'
      )
    }
  }

  console.log('verify-prerender: OK — money page assets match index and exist on disk')
}

try {
  main()
} catch (err) {
  console.error(String(err?.message || err))
  process.exit(1)
}
