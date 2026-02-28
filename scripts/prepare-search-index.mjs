/**
 * Post-build script: extracts text from TEI XML source files and injects
 * hidden searchable content into the static HTML so Pagefind can index it.
 *
 * Run after `next build`, before `pagefind`.
 */

import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'

const DATA_DIR = path.join(process.cwd(), 'probstuecke-data/encodings')
const OUT_DIR = path.join(process.cwd(), 'out')

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

function parseXml(raw) {
  const dom = new JSDOM('')
  const parser = new dom.window.DOMParser()
  return parser.parseFromString(raw, 'application/xml')
}

/** Strip XML tags, collapse whitespace */
function textContent(node) {
  if (!node) return ''
  return node.textContent.replace(/\s+/g, ' ').trim()
}

// ---------------------------------------------------------------------------
// Discover all TEI expression files (same logic as data.ts)
// ---------------------------------------------------------------------------

function findXmlFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...findXmlFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.xml')) results.push(full)
  }
  return results
}

const SPECIAL_TEI_TYPES = new Set(['persons', 'bibliography', 'musical-works', 'guideline'])

function collectExpressions() {
  const allXml = findXmlFiles(DATA_DIR)
  const expressions = []

  for (const filePath of allXml) {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const doc = parseXml(raw)

    if (doc.querySelector('mei')) continue

    const tei = doc.querySelector('TEI')
    if (!tei) continue

    const teiType = tei.getAttribute('type')
    if (teiType && SPECIAL_TEI_TYPES.has(teiType)) continue

    const xmlId = tei.getAttribute('xml:id')
    if (!xmlId) continue

    const title = textContent(tei.querySelector('title'))
    const body = textContent(tei.querySelector('text'))

    expressions.push({ xmlId, title, body })
  }

  return expressions
}

// ---------------------------------------------------------------------------
// Inject hidden div into an HTML file
// ---------------------------------------------------------------------------

function injectIntoHtml(htmlPath, title, body) {
  if (!fs.existsSync(htmlPath)) {
    console.warn(`  SKIP (not found): ${htmlPath}`)
    return false
  }

  let html = fs.readFileSync(htmlPath, 'utf-8')

  // Escape HTML entities in the injected text
  const escape = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const snippet = [
    '<div data-pagefind-body style="display:none!important" aria-hidden="true">',
    `<h1 data-pagefind-meta="title">${escape(title)}</h1>`,
    `<p>${escape(body)}</p>`,
    '</div>',
  ].join('')

  html = html.replace('</body>', `${snippet}</body>`)
  fs.writeFileSync(htmlPath, html, 'utf-8')
  return true
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('=== prepare-search-index ===')
console.log(`Data dir : ${DATA_DIR}`)
console.log(`Output dir: ${OUT_DIR}\n`)

// 1. Expression pages
const expressions = collectExpressions()
console.log(`Found ${expressions.length} expressions`)

let injected = 0
for (const expr of expressions) {
  const htmlPath = path.join(OUT_DIR, expr.xmlId, 'index.html')
  if (injectIntoHtml(htmlPath, expr.title, expr.body)) {
    injected++
  }
}
console.log(`Injected into ${injected} expression pages\n`)

// 2. Index pages
const indexPages = [
  {
    xml: path.join(DATA_DIR, 'indices/persons.xml'),
    htmlDir: 'persons',
    title: 'Index of Persons',
  },
  {
    xml: path.join(DATA_DIR, 'indices/bibliography.xml'),
    htmlDir: 'bibliography',
    title: 'Bibliography',
  },
  {
    xml: path.join(DATA_DIR, 'indices/musical-works.xml'),
    htmlDir: 'musicalworks',
    title: 'Index of Musical Works',
  },
]

for (const page of indexPages) {
  if (!fs.existsSync(page.xml)) {
    console.warn(`  SKIP index (XML not found): ${page.xml}`)
    continue
  }
  const raw = fs.readFileSync(page.xml, 'utf-8')
  const doc = parseXml(raw)
  const body = textContent(doc.querySelector('text'))
  const htmlPath = path.join(OUT_DIR, page.htmlDir, 'index.html')

  if (injectIntoHtml(htmlPath, page.title, body)) {
    console.log(`Injected index page: ${page.htmlDir}`)
  }
}

// 3. Guidelines page
const guidelinesXml = path.join(DATA_DIR, 'guidelines/guidelines_en.xml')
if (fs.existsSync(guidelinesXml)) {
  const raw = fs.readFileSync(guidelinesXml, 'utf-8')
  const doc = parseXml(raw)
  const body = textContent(doc.querySelector('text'))
  const htmlPath = path.join(OUT_DIR, 'guidelines', 'index.html')

  if (injectIntoHtml(htmlPath, 'Edition Guidelines', body)) {
    console.log('Injected guidelines page')
  }
}

console.log('\nDone.')
