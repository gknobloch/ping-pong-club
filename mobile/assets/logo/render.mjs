// Rasterize the logo SVGs to PNG at the sizes Expo needs.
// Run from the repo root (where playwright is installed):
//   node mobile/assets/logo/render.mjs
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

// [source svg, output png, render size, deviceScaleFactor]
const jobs = [
  ['icon.svg', '../icon.png', 1024],
  ['icon.svg', '../../ios/PingPongClub/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png', 1024],
  ['adaptive-icon.svg', '../adaptive-icon.png', 1024],
  ['splash-icon.svg', '../splash-icon.png', 1024],
]

const browser = await chromium.launch()
for (const [src, out, size] of jobs) {
  const svg = readFileSync(join(here, src), 'utf8')
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
  await page.setContent(
    `<!doctype html><meta charset=utf8><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    { waitUntil: 'networkidle' },
  )
  const el = await page.$('svg')
  const buf = await el.screenshot({ omitBackground: true })
  writeFileSync(join(here, out), buf)
  await page.close()
  console.log('wrote', out)
}
await browser.close()
