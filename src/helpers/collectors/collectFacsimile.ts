import type { ExpressionFacsimile, FacsimilePage, FacsimileZone } from '@/lib/types'

/**
 * The page images of a print, for the facsimile view of its page: the pages of the
 * score, one by one, and the pages of the text, with the bars and the paragraphs that
 * the encodings mark on them (<zone>) and which paragraphs refer to which bars.
 *
 * The pages of the score are those of the score's <facsimile> (MEI) that belong to the
 * digitised copy of the print. The text runs from the page where it begins to the pages
 * of its page breaks (<pb facs="…">, TEI); it begins on the page of its first passage
 * marked on a page, or else on the page before its first page break. Where the score ends
 * on the page where the text begins, the score shows the page down to its last bar, the
 * text all of it (the zones of the bars reach into what follows, so the page cannot be
 * divided exactly).
 */

type Region = FacsimilePage['region']

interface Page {
  image: string
  /** the number of the page image in the digitised copy, e.g. bsb10598495 367 */
  copy: string
  scan: number
  width: number
  height: number
  n: string | null
}

interface Zone extends FacsimileZone {
  page: Page
}

const IMAGE_URL = /^(.*\/iiif\/image\/v2\/(bsb\d+)_(\d+))\//
const CANVAS_URL = /\/(bsb\d+)\/canvas\/(\d+)/
const IMAGE_API = 'https://api.digitale-sammlungen.de/iiif/image/v2'

// room above the first paragraph of a section for its heading (§. 1.), relative to the page height
const HEADING = 0.04

const number = (value: string | null) => parseInt(value || '', 10)

const byId = (document: Document) => {
  const ids = new Map<string, Element>()
  for (const el of Array.from(document.getElementsByTagName('*'))) {
    const id = el.getAttribute('xml:id')
    if (id) ids.set(id, el)
  }
  return ids
}

const pointers = (el: Element, attribute = 'facs') =>
  (el.getAttribute(attribute) || '').split(/\s+/).filter(token => token.startsWith('#')).map(token => token.slice(1))

const pageOf = (surface: Element): Page | null => {
  const graphic = Array.from(surface.children).find(child => child.localName === 'graphic')
  const url = graphic?.getAttribute('url') || graphic?.getAttribute('target') || ''
  const image = url.match(IMAGE_URL)
  const canvas = (surface.getAttribute('corresp') || url).match(CANVAS_URL)
  const copy = image?.[2] || canvas?.[1]
  const scan = number(image?.[3] || canvas?.[2] || null)
  if (!copy || !scan) return null
  return {
    image: image?.[1] || `${IMAGE_API}/${copy}_${String(scan).padStart(5, '0')}`,
    copy,
    scan,
    width: number(graphic?.getAttribute('width') || surface.getAttribute('lrx')),
    height: number(graphic?.getAttribute('height') || surface.getAttribute('lry')),
    n: null,
  }
}

/** The pages of the <facsimile> of an encoding by the ID of their surface, and the zones on them */
const facsimileOf = (document: Document | null) => {
  const pages = new Map<string, Page>()
  const zones = new Map<string, { page: Page; x: number; y: number; w: number; h: number }>()
  for (const surface of document ? Array.from(document.getElementsByTagName('surface')) : []) {
    const page = pageOf(surface)
    const id = surface.getAttribute('xml:id')
    if (!page || !id) continue
    pages.set(id, page)
    for (const zone of Array.from(surface.getElementsByTagName('zone'))) {
      const zoneId = zone.getAttribute('xml:id')
      const [ulx, uly, lrx, lry] = ['ulx', 'uly', 'lrx', 'lry'].map(a => number(zone.getAttribute(a)))
      if (!zoneId || [ulx, uly, lrx, lry].some(Number.isNaN)) continue
      zones.set(zoneId, { page, x: ulx, y: uly, w: lrx - ulx, h: lry - uly })
    }
  }
  return { pages, zones }
}

// the same page image, whichever encoding names it
const samePage = (a: Page, b: Page) => a.copy === b.copy && a.scan === b.scan

/**
 * The pages of the text, in their order in the print: those of its page breaks and of its
 * passages marked on a page (a zone, or the whole page), and the page it begins on
 */
const textPages = (tei: Document, facsimile: ReturnType<typeof facsimileOf>, others: Page[]) => {
  const text = tei.getElementsByTagName('text')[0]
  if (!text) return []
  const pages: Page[] = []
  // the page breaks so far, whether the text begins before the first, the first page known,
  // and how many page breaks lie between the beginning of the text and its top
  const seen: { breaks: number; before: boolean; first: Page | null; offset: number } = { breaks: 0, before: false, first: null, offset: 0 }

  const add = (page: Page | undefined, n: string | null = null) => {
    if (!page) return
    if (!seen.first) {
      seen.first = page
      seen.offset = seen.breaks
    }
    const known = pages.find(other => samePage(other, page))
    if (!known) pages.push({ ...page, n })
    else if (n && !known.n) known.n = n
  }

  const visit = (node: Node) => {
    if (node.nodeType === 3) {
      if (seen.breaks === 0 && /\S/.test(node.nodeValue || '')) seen.before = true
      return
    }
    if (node.nodeType !== 1) return
    const el = node as Element
    // the score is shown on its own
    if (el.localName === 'div' && el.getAttribute('type') === 'score') return
    if (el.localName === 'pb') {
      seen.breaks++
      add(facsimile.pages.get(pointers(el)[0] || ''), el.getAttribute('n'))
      return
    }
    for (const target of pointers(el)) add(facsimile.pages.get(target) || facsimile.zones.get(target)?.page)
    Array.from(el.childNodes).forEach(visit)
  }
  visit(text)

  // the text begins on a page before the first page known: the page as many before as
  // there are page breaks in between, if the encodings have its image
  const first = seen.first as Page | null
  if (first && seen.before && seen.offset > 0) {
    const start = [...facsimile.pages.values(), ...others]
      .find(page => page.copy === first.copy && page.scan === first.scan - seen.offset)
    const known = pages.find(page => samePage(page, first))
    const n = known?.n && /^\d+$/.test(known.n) ? String(number(known.n) - seen.offset) : null
    if (start) pages.push({ ...start, n })
  }
  return pages.sort((a, b) => a.scan - b.scan)
}

// pages without a number in the encodings are numbered from the nearest page with one
const numberPages = (pages: Page[]) => {
  const numbered = pages.filter(page => page.n && /^\d+$/.test(page.n))
  for (const page of pages) {
    if (page.n) continue
    const nearest = numbered
      .filter(other => other.copy === page.copy)
      .sort((a, b) => Math.abs(a.scan - page.scan) - Math.abs(b.scan - page.scan))[0]
    if (nearest) page.n = String(number(nearest.n) + page.scan - nearest.scan)
  }
}

// a zone belongs to the part of the page shown if its middle lies in it
const within = (zone: FacsimileZone, region: Region) => {
  const middle = zone.y + zone.h / 2
  return middle >= region.y && middle <= region.y + region.h
}

const toPage = (page: Page, region: Region, zones: Zone[], sections: { id: string; y: number; page: Page }[]): FacsimilePage => ({
  image: page.image,
  n: page.n,
  region,
  full: region.x === 0 && region.y === 0 && region.w === page.width && region.h === page.height,
  zones: zones
    .filter(zone => samePage(zone.page, page) && within(zone, region))
    .map(({ key, x, y, w, h }) => ({ key, x, y, w, h })),
  sections: sections
    .filter(section => samePage(section.page, page) && section.y >= region.y && section.y < region.y + region.h)
    .map(({ id, y }) => ({ id, y })),
})

export const collectFacsimile = (tei: Document, score: Document | null, iiif: string | null): ExpressionFacsimile | null => {
  const text = facsimileOf(tei)
  const music = facsimileOf(score)

  // the digitised copy of the print
  const copy = [...text.pages.values()][0]?.copy || iiif?.match(/bsb\d+/)?.[0]
  if (!copy) return null

  // the pages of the score: those of its page breaks, numbered by them, or else all its pages of the copy
  const breaks = score ? Array.from(score.getElementsByTagName('pb')) : []
  const ofCopy = [...music.pages.entries()].filter(([, page]) => page.copy === copy)
  const broken = ofCopy.filter(([id]) => breaks.some(pb => pointers(pb).includes(id)))
  const scorePages = (broken.length > 0 ? broken : ofCopy).map(([id, page]) => ({
    ...page,
    n: breaks.find(pb => pointers(pb).includes(id))?.getAttribute('n') ?? null,
  }))
  const pages = textPages(tei, text, ofCopy.map(([, page]) => page))
  if (pages.length === 0 && scorePages.length === 0) return null
  numberPages([...scorePages, ...pages])

  // the bars: the zones of their staves, on the pages of this print
  const meiIds = score ? byId(score) : new Map<string, Element>()
  const bars: Zone[] = []
  for (const staff of score ? Array.from(score.getElementsByTagName('staff')) : []) {
    const measure = staff.closest('measure')?.getAttribute('xml:id')
    if (!measure) continue
    for (const target of pointers(staff)) {
      const zone = music.zones.get(target)
      if (zone && zone.page.copy === copy) bars.push({ key: measure, ...zone })
    }
  }
  const barKeys = new Set(bars.map(bar => bar.key))

  // the paragraphs, and the bars they refer to
  const paragraphs: Zone[] = []
  const links: [string, string][] = []
  const commentary = Array.from(tei.getElementsByTagName('p')).filter(p => !p.closest('div[type="score"]'))
  for (const p of commentary) {
    const key = p.getAttribute('xml:id')
    const zones = pointers(p).map(target => text.zones.get(target)).filter(zone => !!zone)
    if (!key || zones.length === 0) continue
    zones.forEach(zone => paragraphs.push({ key, ...zone }))
    const measures = new Set(Array.from(p.getElementsByTagName('ref'))
      .flatMap(ref => pointers(ref, 'target'))
      .map(id => meiIds.get(id))
      .map(el => (el?.localName === 'measure' ? el : el?.closest('measure'))?.getAttribute('xml:id'))
      .filter((id): id is string => !!id && barKeys.has(id)))
    measures.forEach(measure => links.push([key, measure]))
  }

  // the sections begin a little above their first paragraph marked on a page, with their heading
  const sections = Array.from(tei.querySelectorAll('text div[n]'))
    .filter(div => div.getAttribute('type') !== 'chapter' && div.getAttribute('xml:id'))
    .flatMap(div => {
      const first = Array.from(div.getElementsByTagName('p')).map(p => p.getAttribute('xml:id')).find(id => paragraphs.some(zone => zone.key === id))
      const zone = paragraphs.find(zone => zone.key === first)
      return zone ? [{ id: div.getAttribute('xml:id')!, page: zone.page, y: Math.max(0, zone.y - zone.page.height * HEADING) }] : []
    })

  const full = (page: Page): Region => ({ x: 0, y: 0, w: page.width, h: page.height })
  const scoreRegions = scorePages.map(full)
  const textRegions = pages.map(full)

  // on a page with the end of the score and the beginning of the text, the score ends with its last bar
  const shared = scorePages.length > 0 && pages.length > 0 && samePage(scorePages[scorePages.length - 1], pages[0])
  const lastBars = shared ? bars.filter(bar => samePage(bar.page, pages[0])) : []
  if (lastBars.length > 0) {
    const page = pages[0]
    const end = Math.min(page.height, Math.max(...lastBars.map(bar => bar.y + bar.h)))
    scoreRegions[scoreRegions.length - 1] = { x: 0, y: 0, w: page.width, h: Math.round(end) }
  }

  return {
    score: scorePages.map((page, i) => toPage(page, scoreRegions[i], bars, [])),
    text: pages.map((page, i) => toPage(page, textRegions[i], paragraphs, sections)),
    links,
  }
}
