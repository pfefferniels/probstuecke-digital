import * as fs from 'fs'
import * as path from 'path'
import { JSDOM } from 'jsdom'
import serialize from 'w3c-xmlserializer'
import createVerovioModule from 'verovio/wasm'
import { VerovioToolkit } from 'verovio/esm'
import { transformToCeteicean } from '@/helpers/transformToCeteicean'
import { alignTranslation, type Original } from '@/helpers/alignTranslation'
import { extractFromXML } from '@/helpers/extractFromTEI'
import { collectExpressionMetadata, collectEmbeddedMEI, collectRefTargets } from '@/helpers/collectors/index'
import { collectZones } from '@/helpers/collectors/collectZones'
import { collectPersName } from '@/helpers/collectors/collectPersName'
import { collectHeader } from '@/helpers/collectors/collectHeader'
import { collectMedia } from '@/helpers/collectors/collectMedia'
import { normaliseDocument, parseLexicon, type Lexicon } from '@/helpers/normalise'
import type {
  Work,
  WorkExpression,
  WorkKey,
  Person,
  Bibliography,
  MusicalWork,
  Guideline,
  About,
  Term,
  TermOccurrence,
  TermSummary,
  Register,
  Expression,
  ExpressionContext,
  ParallelText,
  TransformedTEI,
  ExpressionIndexData,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), 'probstuecke-data/encodings')

// ---------------------------------------------------------------------------
// Verovio singleton
// ---------------------------------------------------------------------------

let verovioToolkit: VerovioToolkit

const getVerovioToolkit = async (): Promise<VerovioToolkit> => {
  if (!verovioToolkit) {
    const vrvModule = await createVerovioModule()
    verovioToolkit = new VerovioToolkit(vrvModule)
  }
  return verovioToolkit
}

// ---------------------------------------------------------------------------
// Modernize Fraktur TEI with the edition's lexicon
// ---------------------------------------------------------------------------

let cachedLexicon: Lexicon | null = null

const modernizeTEI = (rawXml: string): string => {
  if (!cachedLexicon) {
    const lexiconPath = path.join(DATA_DIR, '../normalisation/lexicon.tsv')
    cachedLexicon = parseLexicon(fs.readFileSync(lexiconPath, 'utf-8'))
  }
  const document = parseXml(rawXml)
  normaliseDocument(document, cachedLexicon)
  return serialize(document)
}

// ---------------------------------------------------------------------------
// Helpers: recursive file discovery
// ---------------------------------------------------------------------------

const findXmlFiles = (dir: string): string[] => {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findXmlFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      results.push(full)
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Helpers: DOM parsing
// ---------------------------------------------------------------------------

const parseXml = (rawXml: string): Document => {
  const dom = new JSDOM('')
  const DOMParser = dom.window.DOMParser
  const parser = new DOMParser()
  return parser.parseFromString(rawXml, 'application/xml')
}

// ---------------------------------------------------------------------------
// Module-level caches
// ---------------------------------------------------------------------------

let cachedWorks: Work[] | null = null
let cachedPersons: Person[] | null = null
let cachedBibliography: Bibliography[] | null = null
let cachedMusicalWorks: MusicalWork[] | null = null
let cachedGuidelines: Guideline | null = null
let cachedAbout: About | null = null
let cachedTerms: Term[] | null = null
let cachedRegister: Register | null = null
let cachedWorkList: Document | null = null
let cachedExpressionIndex: Map<string, string> | null = null
const cachedExpressionById = new Map<string, Expression>()

// ---------------------------------------------------------------------------
// loadWorks
// ---------------------------------------------------------------------------

// ISO 639-2 codes used in works.xml → BCP 47 language tags
const LANGUAGE_TAGS: Record<string, string> = { deu: 'de', eng: 'en', fra: 'fr' }

const readWorkList = (): Document => {
  if (!cachedWorkList) {
    cachedWorkList = parseXml(fs.readFileSync(path.join(DATA_DIR, 'works.xml'), 'utf-8'))
  }
  return cachedWorkList
}

const readWorkExpressions = (work: Element): WorkExpression[] =>
  Array.from(work.querySelectorAll('expression')).map((expression) => {
    const date =
      expression.querySelector('creation')?.getAttribute('startdate') || '[unknown]'
    const type = expression.getAttribute('type') || '[unknown]'
    const language = expression.querySelector('language')
    const lang = language?.textContent || 'German'
    const langCode = language?.getAttribute('ident') || 'deu'
    const author = expression.querySelector('author')?.textContent || ''
    const referringTo = expression
      .getAttribute('data')!
      .split(' ')
      .map((str) => str.slice(1))

    return {
      date,
      type,
      id: expression.getAttribute('xml:id') || `id_${Math.random()}`,
      referringTo,
      lang,
      langCode,
      author,
    }
  })

const readWorkKey = (work: Element): WorkKey => {
  const key = work.querySelector('key')
  return key
    ? Array.from(key.attributes).reduce((obj: Record<string, string>, attr) => {
        obj[attr.name] = attr.value
        return obj
      }, {})
    : {}
}

const findExpressionContext = (expressionId: string): ExpressionContext | null => {
  for (const work of Array.from(readWorkList().querySelectorAll('work'))) {
    const expressions = readWorkExpressions(work)
    const expression = expressions.find((e) => e.referringTo.includes(expressionId))
    if (expression) {
      return {
        workTitle: work.querySelector('title')?.textContent || '[no title]',
        key: readWorkKey(work),
        expression,
        siblings: expressions,
      }
    }
  }
  return null
}

export const loadWorks = async (): Promise<Work[]> => {
  if (cachedWorks) return cachedWorks

  const document = readWorkList()

  const toolkit = await getVerovioToolkit()

  toolkit.setOptions({
    svgViewBox: true,
    footer: 'none',
    adjustPageHeight: true,
    svgAdditionalAttribute: ['measure@facs'],
  })

  const works: Work[] = Array.from(document.querySelectorAll('work')).map((work) => {
    const incipitCode = work.querySelector('incip')
    let incipitSvg = ''
    if (incipitCode) {
      toolkit.loadData(incipitCode.textContent!.trim())
      incipitSvg = toolkit.renderToSVG(1)
    }

    return {
      xmlId: work.getAttribute('xml:id'),
      title: work.querySelector('title')?.textContent || '[no title]',
      incipitSvg,
      key: readWorkKey(work),
      expressions: readWorkExpressions(work),
    }
  })

  cachedWorks = works
  return works
}

// ---------------------------------------------------------------------------
// loadPersons
// ---------------------------------------------------------------------------

export const loadPersons = async (): Promise<Person[]> => {
  if (cachedPersons) return cachedPersons

  const filePath = path.join(DATA_DIR, 'indices/persons.xml')
  const rawXml = fs.readFileSync(filePath, 'utf-8')
  const document = parseXml(rawXml)

  const persons: Person[] = Array.from(document.querySelectorAll('person')).map((person) => {
    const surname = person.querySelector('surname')?.textContent || ''
    const forename = person.querySelector('forename')?.textContent || ''
    // persons without forename/surname (e.g. Apollo, Aristoxenus) use <name> and <addName>
    const name = person.querySelector('persName > name')?.textContent || ''
    const addName = person.querySelector('persName > addName')?.textContent || ''

    return {
      xmlId: person.getAttribute('xml:id') || 'no-id',
      name: [forename, surname, name, addName].filter(Boolean).join(' '),
      surname,
      forename,
      birth: person.querySelector('birth')?.textContent || '',
      death: person.querySelector('death')?.textContent || '',
      idno: person.querySelector('idno')?.textContent || '',
    }
  })

  cachedPersons = persons
  return persons
}

// ---------------------------------------------------------------------------
// loadBibliography
// ---------------------------------------------------------------------------

export const loadBibliography = async (): Promise<Bibliography[]> => {
  if (cachedBibliography) return cachedBibliography

  const filePath = path.join(DATA_DIR, 'indices/bibliography.xml')
  const rawXml = fs.readFileSync(filePath, 'utf-8')
  const document = parseXml(rawXml)

  const entries: Bibliography[] = Array.from(document.querySelectorAll('bibl')).map((entry) => {
    return {
      xmlId: entry.getAttribute('xml:id') || 'no-id',
      title: entry.querySelector('title')?.textContent || '',
      author: collectPersName(entry.querySelector('author')),
      editor: collectPersName(entry.querySelector('editor')),
      pubPlace: entry.querySelector('pubPlace')?.textContent || '',
      date: entry.querySelector('date')?.textContent || '',
      link: entry.querySelector('note')?.getAttribute('target') || '',
    }
  })

  cachedBibliography = entries
  return entries
}

// ---------------------------------------------------------------------------
// loadMusicalWorks
// ---------------------------------------------------------------------------

export const loadMusicalWorks = async (): Promise<MusicalWork[]> => {
  if (cachedMusicalWorks) return cachedMusicalWorks

  const filePath = path.join(DATA_DIR, 'indices/musical-works.xml')
  const rawXml = fs.readFileSync(filePath, 'utf-8')
  const document = parseXml(rawXml)

  const entries: MusicalWork[] = Array.from(document.querySelectorAll('bibl')).map((entry) => {
    return {
      xmlId: entry.getAttribute('xml:id') || 'no-id',
      title: entry.querySelector('title')?.textContent || '',
      author: collectPersName(entry.querySelector('author')),
      pubPlace: entry.querySelector('pubPlace')?.textContent || '',
      date: entry.querySelector('date')?.textContent || '',
      link: entry.querySelector('note')?.getAttribute('target') || '',
    }
  })

  cachedMusicalWorks = entries
  return entries
}

// ---------------------------------------------------------------------------
// loadTerms: the index of terms, based on Mattheson's Register
// ---------------------------------------------------------------------------

const TEI_NS = 'http://www.tei-c.org/ns/1.0'

// text of the quotation in a <ref>, split at the marked <term>
const readQuote = (ref: Element): TermOccurrence['quote'] => {
  const term = ref.getElementsByTagNameNS(TEI_NS, 'term')[0]
  if (!term) return null
  let pre = ''
  let post = ''
  let after = false
  for (const node of Array.from(ref.childNodes)) {
    if (node === term) {
      after = true
      continue
    }
    if (after) post += node.textContent
    else pre += node.textContent
  }
  const clean = (text: string) => text.replace(/\s+/g, ' ')
  return { pre: clean(pre).trimStart(), key: clean(term.textContent || ''), post: clean(post).trimEnd() }
}

const expressionIdOfFile = new Map<string, string | null>()

const readExpressionId = (file: string): string | null => {
  if (!expressionIdOfFile.has(file)) {
    let id: string | null = null
    if (fs.existsSync(file)) {
      const match = fs.readFileSync(file, 'utf-8').match(/<TEI\b[^>]*\bxml:id="([^"]+)"/)
      id = match ? match[1] : null
    }
    expressionIdOfFile.set(file, id)
  }
  return expressionIdOfFile.get(file) ?? null
}

const readOccurrence = (ref: Element, indexDir: string): TermOccurrence => {
  const [file, fragment] = (ref.getAttribute('target') || '').split('#')
  const piece = file.match(/^\.\.\/(\d+)\//)?.[1] ?? null
  const target = fragment || null
  const targetKind: TermOccurrence['targetKind'] = !target
    ? 'text'
    : target.startsWith('t_')
      ? 'word'
      : target === 'score' || target.startsWith('music-example') || target.startsWith('aria')
        ? 'music'
        : 'passage'
  return {
    type: ref.getAttribute('type') === 'editorial' ? 'editorial' : 'register',
    page: ref.getAttribute('n'),
    piece,
    expressionId: file ? readExpressionId(path.join(indexDir, file)) : null,
    target,
    targetKind,
    quote: readQuote(ref),
    registerEntry: ref.getAttribute('corresp')?.split('#')[1] ?? null,
  }
}

export const loadTerms = async (): Promise<Term[]> => {
  if (cachedTerms) return cachedTerms

  const indexDir = path.join(DATA_DIR, 'indices')
  const document = parseXml(fs.readFileSync(path.join(indexDir, 'terms.xml'), 'utf-8'))
  const list = document.getElementsByTagNameNS(TEI_NS, 'list')[0]
  const items = list ? Array.from(list.children).filter((el) => el.localName === 'item') : []

  cachedTerms = items.map((item) => {
    const labels = Array.from(item.children).filter((el) => el.localName === 'label')
    const ptr = Array.from(item.children).find((el) => el.localName === 'ptr')
    const refs = Array.from(item.getElementsByTagNameNS(TEI_NS, 'ref'))
    const page = (o: TermOccurrence) => Number(o.page) || 0
    return {
      xmlId: item.getAttribute('xml:id') || 'no-id',
      label: labels.find((l) => l.getAttribute('type') === 'reg')?.textContent || '',
      orig: labels.filter((l) => l.getAttribute('type') === 'orig').map((l) => l.textContent || ''),
      gloss: Array.from(item.children).find((el) => el.localName === 'gloss')?.textContent || '',
      registerEntries: (ptr?.getAttribute('target') || '')
        .split(/\s+/)
        .map((token) => token.split('#')[1])
        .filter(Boolean),
      occurrences: refs.map((ref) => readOccurrence(ref, indexDir)).sort((a, b) => page(a) - page(b)),
    }
  })
  return cachedTerms
}

/** label and gloss of the terms tagged in a text, by xml:id */
export const loadTermSummaries = async (ids: string[]): Promise<Record<string, TermSummary>> => {
  const wanted = new Set(ids)
  const summaries: Record<string, TermSummary> = {}
  for (const term of await loadTerms()) {
    if (wanted.has(term.xmlId)) summaries[term.xmlId] = { label: term.label, gloss: term.gloss }
  }
  return summaries
}

// ---------------------------------------------------------------------------
// loadRegister: Mattheson's Register, with links from its entries to the indices
// ---------------------------------------------------------------------------

const INDEX_ROUTES: Record<string, string> = {
  'persons.xml': 'persons',
  'musical-works.xml': 'musicalworks',
  'bibliography.xml': 'bibliography',
  'terms.xml': 'terms',
}

export const loadRegister = async (): Promise<Register> => {
  if (cachedRegister) return cachedRegister

  const indexRoutes: Record<string, string> = {}
  for (const [file, route] of Object.entries(INDEX_ROUTES)) {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'indices', file), 'utf-8')
    for (const match of raw.matchAll(/xml:id="([^"]+)"/g)) indexRoutes[match[1]] = route
  }

  const rawXml = fs.readFileSync(path.join(DATA_DIR, 'register/register_1731.xml'), 'utf-8')
  const text = extractFromXML(modernizeTEI(rawXml), 'text').extracted
  cachedRegister = { transformed: transformToCeteicean(text || ''), indexRoutes }
  return cachedRegister
}

// ---------------------------------------------------------------------------
// loadGuidelines
// ---------------------------------------------------------------------------

export const loadGuidelines = async (): Promise<Guideline> => {
  if (cachedGuidelines) return cachedGuidelines

  const filePath = path.join(DATA_DIR, 'guidelines/guidelines_en.xml')
  const rawXml = fs.readFileSync(filePath, 'utf-8')
  const transformed = transformToCeteicean(rawXml)

  cachedGuidelines = { transformed }
  return cachedGuidelines
}

// ---------------------------------------------------------------------------
// loadAbout
// ---------------------------------------------------------------------------

export const loadAbout = async (): Promise<About> => {
  if (cachedAbout) return cachedAbout

  const filePath = path.join(DATA_DIR, 'about/about_en.xml')
  const rawXml = fs.readFileSync(filePath, 'utf-8')
  const transformed = transformToCeteicean(rawXml)

  cachedAbout = { transformed }
  return cachedAbout
}

const XML_NS = 'http://www.w3.org/XML/1998/namespace'

// The mentions of persons, works and books in a text mostly have no xml:id. They get one here,
// numbered in document order, so that the indices can link to each (see OccurenceBox). The
// piece pages and the indices both call this on the same file, so the IDs agree.
const addMentionIds = (document: Document) => {
  const mentions = document.querySelectorAll('text persName[corresp], text name[corresp], text bibl[corresp]')
  Array.from(mentions).forEach((mention, i) => {
    if (!mention.hasAttribute('xml:id')) mention.setAttributeNS(XML_NS, 'xml:id', `mention-${i + 1}`)
  })
}

// Elements pointing to an index entry; @corresp may name several entries ("#t_a #t_b")
const collectIndexRefs = (document: Document) =>
  Array.from(document.querySelectorAll('[corresp]')).flatMap((el) =>
    (el.getAttribute('corresp') || '')
      .split(/\s+/)
      .filter((token) => token.startsWith('#'))
      .map((token) => ({ xmlId: el.getAttribute('xml:id'), corresp: token.slice(1) }))
  )

// ---------------------------------------------------------------------------
// A translation side by side with its original
// ---------------------------------------------------------------------------

// the original as its own page shows it: a Fraktur print in modern spelling
const loadOriginal = (filePath: string): Original | null => {
  if (!fs.existsSync(filePath)) return null
  const rawXml = fs.readFileSync(filePath, 'utf-8')
  const document = parseXml(rawXml)
  const tei = document.querySelector('TEI')
  const id = tei?.getAttribute('xml:id')
  const context = id ? findExpressionContext(id) : null
  return {
    document: collectExpressionMetadata(document).isFraktur ? parseXml(modernizeTEI(rawXml)) : document,
    lang: LANGUAGE_TAGS[context?.expression.langCode ?? ''] || tei?.getAttribute('xml:lang') || 'de',
  }
}

const buildParallelText = (textXml: string | null, filePath: string): ParallelText | null => {
  if (!textXml) return null
  const document = parseXml(textXml)
  const originals = new Map<string, Original | null>()
  const aligned = alignTranslation(document, (file) => {
    const originalPath = path.resolve(path.dirname(filePath), file)
    if (!originals.has(originalPath)) originals.set(originalPath, loadOriginal(originalPath))
    return originals.get(originalPath)!
  })
  if (!aligned) return null
  return { text: transformToCeteicean(serialize(document)), ...aligned }
}

// ---------------------------------------------------------------------------
// Expression processing (core logic ported from gatsby-node onCreateNode)
// ---------------------------------------------------------------------------

const SPECIAL_TEI_TYPES = new Set(['persons', 'bibliography', 'musical-works', 'terms', 'guideline', 'about'])

const processExpressionFile = async (filePath: string): Promise<Expression | null> => {
  const rawXml = fs.readFileSync(filePath, 'utf-8')
  const document = parseXml(rawXml)

  // Skip MEI files
  const meiRoot = document.querySelector('mei')
  if (meiRoot) return null

  // Must have a TEI root
  const teiRoot = document.querySelector('TEI')
  if (!teiRoot) return null

  // Skip special-type TEI files (persons, bibliography, etc.)
  const teiType = teiRoot.getAttribute('type')
  if (teiType && SPECIAL_TEI_TYPES.has(teiType)) return null

  addMentionIds(document)

  // Collect metadata, MEI, refs, indexRefs
  const metadata = collectExpressionMetadata(document)
  const header = collectHeader(document)
  const context = metadata.expressionId ? findExpressionContext(metadata.expressionId) : null
  const lang =
    LANGUAGE_TAGS[context?.expression.langCode ?? ''] ||
    teiRoot.getAttribute('xml:lang') ||
    'de'
  const mei = collectEmbeddedMEI(document, filePath)
  const media = collectMedia(document, filePath, DATA_DIR)
  const refTargets = collectRefTargets(document)
  const indexRefs = collectIndexRefs(document)

  // Collect zones from embedded MEI
  const parser = new JSDOM('').window.DOMParser
  const domParser = new parser()
  const zones = mei
    .map((meiEntry) => {
      const meiDoc = domParser.parseFromString(meiEntry.mei, 'application/xml')
      return collectZones(meiDoc)
    })
    .flat()

  // Modernize Fraktur TEI
  const xml = serialize(document)
  const modernized = metadata.isFraktur ? modernizeTEI(xml) : xml

  // Extract sections exactly as in gatsby-node
  const selectors: Record<string, string> = {
    // the head of the score division; a head in its figure is a caption of the score
    title: 'div[type="score"] > head',
    score: 'div[type="score"]',
    metadata: 'fileDesc',
    text: 'text',
  }

  const extracts = Object.entries(selectors)
    .reduce(
      (
        prev: { fill: string; with: string | null; reduced: string }[],
        [fill, selector]
      ) => {
        const extract = extractFromXML(
          prev.length === 0 ? modernized : prev[prev.length - 1].reduced,
          selector
        )

        prev.push({
          fill,
          with: extract.extracted,
          reduced: extract.original,
        })

        return prev
      },
      []
    )

  const sections = extracts
    .map((extract) => {
      return {
        fill: extract.fill,
        // a selector may find nothing, e.g. lessons have no score section
        with: extract.with ? transformToCeteicean(extract.with) : null,
      }
    })
    .reduce((prev: Record<string, TransformedTEI | null>, curr) => {
      prev[curr.fill] = curr.with
      return prev
    }, {})

  return {
    expressionId: metadata.expressionId,
    isFraktur: metadata.isFraktur,
    label: metadata.label,
    score: sections.score || null,
    title: sections.title || null,
    text: sections.text || null,
    parallel: buildParallelText(extracts.find((extract) => extract.fill === 'text')?.with ?? null, filePath),
    mei,
    media,
    zones,
    refTargets,
    indexRefs,
    sourcePath: path.relative(DATA_DIR, filePath).split(path.sep).join('/'),
    lang,
    header,
    context,
  }
}

// ---------------------------------------------------------------------------
// Expression index: lightweight scan mapping expressionId → filePath
// ---------------------------------------------------------------------------

const buildExpressionIndex = (): Map<string, string> => {
  if (cachedExpressionIndex) return cachedExpressionIndex

  const allXmlFiles = findXmlFiles(DATA_DIR)
  const index = new Map<string, string>()

  for (const filePath of allXmlFiles) {
    const rawXml = fs.readFileSync(filePath, 'utf-8')
    const document = parseXml(rawXml)

    if (document.querySelector('mei')) continue

    const teiRoot = document.querySelector('TEI')
    if (!teiRoot) continue

    const teiType = teiRoot.getAttribute('type')
    if (teiType && SPECIAL_TEI_TYPES.has(teiType)) continue

    const xmlId = teiRoot.getAttribute('xml:id')
    if (xmlId) {
      index.set(xmlId, filePath)
    }
  }

  cachedExpressionIndex = index
  return index
}

// ---------------------------------------------------------------------------
// loadExpressionIds (for generateStaticParams)
// ---------------------------------------------------------------------------

export const loadExpressionIds = (): { expressionId: string }[] => {
  const index = buildExpressionIndex()
  return Array.from(index.keys()).map((id) => ({ expressionId: id }))
}

// ---------------------------------------------------------------------------
// loadExpression (processes a single file)
// ---------------------------------------------------------------------------

export const loadExpression = async (
  expressionId: string
): Promise<Expression | undefined> => {
  if (cachedExpressionById.has(expressionId)) return cachedExpressionById.get(expressionId)

  const index = buildExpressionIndex()
  const filePath = index.get(expressionId)
  if (!filePath) return undefined

  const expression = await processExpressionFile(filePath)
  if (expression) {
    cachedExpressionById.set(expressionId, expression)
  }
  return expression ?? undefined
}

// ---------------------------------------------------------------------------
// loadExpressionIndexRefs (lightweight – skips expensive transformations)
// ---------------------------------------------------------------------------

let cachedExpressionIndexRefs: ExpressionIndexData[] | null = null

export const loadExpressionIndexRefs = async (): Promise<ExpressionIndexData[]> => {
  if (cachedExpressionIndexRefs) return cachedExpressionIndexRefs

  const allXmlFiles = findXmlFiles(DATA_DIR)
  const results: { data: ExpressionIndexData; work: string; version: number }[] = []

  for (const filePath of allXmlFiles) {
    const rawXml = fs.readFileSync(filePath, 'utf-8')
    const document = parseXml(rawXml)

    const meiRoot = document.querySelector('mei')
    if (meiRoot) continue

    const teiRoot = document.querySelector('TEI')
    if (!teiRoot) continue

    const teiType = teiRoot.getAttribute('type')
    if (teiType && SPECIAL_TEI_TYPES.has(teiType)) continue

    const expressionId = teiRoot.getAttribute('xml:id')
    const label = teiRoot.querySelector('title')?.textContent ?? null

    addMentionIds(document)
    const indexRefs = collectIndexRefs(document)
    const context = expressionId ? findExpressionContext(expressionId) : null

    results.push({
      data: {
        expressionId,
        label,
        context: context && { workTitle: context.workTitle, expression: context.expression },
        indexRefs,
      },
      work: context?.workTitle ?? label ?? '',
      version: context ? context.siblings.indexOf(context.expression) : 0,
    })
  }

  // by Probstück, then in the order of the versions on the piece pages
  cachedExpressionIndexRefs = results
    .sort((a, b) => a.work.localeCompare(b.work, 'en', { numeric: true }) || a.version - b.version)
    .map(({ data }) => data)
  return cachedExpressionIndexRefs
}
