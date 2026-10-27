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

const SPEAKING = new Set(['u', 'kinesic', 'incident', 'vocal'])

/**
 * Text of a TEI element as the page shows it: in lessons, utterances and actions
 * are preceded by the names of the participants (@who), and what the page hides
 * (rend="hidden") is left out
 */
function indexText(root, doc) {
  const names = new Map(
    Array.from(doc.querySelectorAll('particDesc person, text listPerson person'))
      .map(person => [person.getAttribute('xml:id'), textContent(person.querySelector('persName'))])
  )
  const nameOf = el => (el.getAttribute('who') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(token => names.get(token.replace(/^#/, '')) || token.replace(/^#/, ''))
    .join(', ')

  const parts = []
  const walk = node => {
    if (node.nodeType === 3) {
      parts.push(node.nodeValue)
      return
    }
    if (node.nodeType !== 1 || node.getAttribute('rend') === 'hidden') return
    const name = SPEAKING.has(node.localName) ? nameOf(node) : ''
    if (name) parts.push(` ${name}${node.localName === 'u' ? ':' : ''} `)
    for (const child of Array.from(node.childNodes)) walk(child)
    if (name) parts.push(' ')
  }
  if (root) walk(root)
  return parts.join('').replace(/\s+/g, ' ').trim()
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

const SPECIAL_TEI_TYPES = new Set(['persons', 'bibliography', 'musical-works', 'terms', 'guideline', 'about'])

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
    const body = indexText(tei.querySelector('text'), doc)

    expressions.push({ xmlId, title, body })
  }

  return expressions
}

// ---------------------------------------------------------------------------
// Inject hidden div into an HTML file
// ---------------------------------------------------------------------------

function decodeEntities(s) {
  return s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** The page's own <title> without the site name, e.g. "Probstück 1 · Edition 1731" */
function pageTitleOf(htmlPath) {
  if (!fs.existsSync(htmlPath)) return null
  const html = fs.readFileSync(htmlPath, 'utf-8')
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
  return title ? decodeEntities(title).replace(/ \| Probstücke Digital$/, '') : null
}

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
  // the page title names piece and version; the TEI title is the same for 1719 and 1731
  const title = pageTitleOf(htmlPath) || expr.title
  if (injectIntoHtml(htmlPath, title, expr.body)) {
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
  {
    xml: path.join(DATA_DIR, 'indices/terms.xml'),
    htmlDir: 'terms',
    title: 'Index of Terms',
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

// 3. Guidelines and About pages
const textPages = [
  { xml: 'guidelines/guidelines_en.xml', htmlDir: 'guidelines', title: 'Edition Guidelines' },
  { xml: 'about/about_en.xml', htmlDir: 'about', title: 'About the Edition' },
  { xml: 'register/register_1731.xml', htmlDir: 'register', title: 'Mattheson’s Register (1731)' },
]

// long s and umlauts with superscript e in their modern form, so that the diplomatic text can be found
const UMLAUTS = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' }
const searchable = (text) => text.replace(/ſ/g, 's').replace(/([aouAOU])\u0364/g, (_, vowel) => UMLAUTS[vowel])

for (const page of textPages) {
  const xmlPath = path.join(DATA_DIR, page.xml)
  if (!fs.existsSync(xmlPath)) continue
  const raw = fs.readFileSync(xmlPath, 'utf-8')
  const doc = parseXml(raw)
  const body = searchable(textContent(doc.querySelector('text')))
  const htmlPath = path.join(OUT_DIR, page.htmlDir, 'index.html')

  if (injectIntoHtml(htmlPath, page.title, body)) {
    console.log(`Injected ${page.htmlDir} page`)
  }
}

console.log('\nDone.')
