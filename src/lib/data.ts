import * as fs from 'fs'
import * as path from 'path'
import { JSDOM } from 'jsdom'
import createVerovioModule from 'verovio/wasm'
import { VerovioToolkit } from 'verovio/esm'
import { transformToCeteicean } from '@/helpers/transformToCeteicean'
import { extractFromXML } from '@/helpers/extractFromTEI'
import { collectExpressionMetadata, collectEmbeddedMEI, collectRefTargets } from '@/helpers/collectors/index'
import { collectZones } from '@/helpers/collectors/collectZones'
import { collectPersName } from '@/helpers/collectors/collectPersName'
import { collectHeader } from '@/helpers/collectors/collectHeader'
import type {
  Work,
  WorkExpression,
  WorkKey,
  Person,
  Bibliography,
  MusicalWork,
  Guideline,
  About,
  Expression,
  ExpressionContext,
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
// Modernize TEI via DTA CAB
// ---------------------------------------------------------------------------

const modernizeTEI = async (rawXml: string, attempts = 2): Promise<string> => {
  try {
    const modernized = await fetch(
      'https://www.deutschestextarchiv.de/public/cab/query?a=default&fmt=xml&clean=1&pretty=1&raw=1&qname=qd&file=C%3A%5Cfakepath%5Ccomments_de.xml',
      {
        referrer: 'https://www.deutschestextarchiv.de/public/cab/file',
        body: rawXml,
        method: 'POST',
        mode: 'cors',
      }
    )
    if (!modernized.ok) throw new Error(`HTTP ${modernized.status}`)

    // under load CAB sometimes answers with an HTML error page instead of TEI
    const text = await modernized.text()
    if (!parseXml(text).querySelector('TEI text')) throw new Error('response is not a TEI document')
    return text
  } catch (e) {
    if (attempts > 1) return modernizeTEI(rawXml, attempts - 1)
    console.error('Error fetching modernized version: ' + (e as Error).message)
    return rawXml
  }
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

// ---------------------------------------------------------------------------
// Expression processing (core logic ported from gatsby-node onCreateNode)
// ---------------------------------------------------------------------------

const SPECIAL_TEI_TYPES = new Set(['persons', 'bibliography', 'musical-works', 'guideline', 'about'])

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

  // Collect metadata, MEI, refs, indexRefs
  const metadata = collectExpressionMetadata(document)
  const header = collectHeader(document)
  const context = metadata.expressionId ? findExpressionContext(metadata.expressionId) : null
  const lang =
    LANGUAGE_TAGS[context?.expression.langCode ?? ''] ||
    teiRoot.getAttribute('xml:lang') ||
    'de'
  const mei = collectEmbeddedMEI(document, filePath)
  const refTargets = collectRefTargets(document)
  const indexRefs = Array.from(document.querySelectorAll('[corresp]')).map((persName) => {
    return {
      xmlId: persName.getAttribute('xml:id'),
      corresp: persName.getAttribute('corresp')!.slice(1),
    }
  })

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
  const modernized = metadata.isFraktur ? await modernizeTEI(rawXml) : rawXml

  // Extract sections exactly as in gatsby-node
  const selectors: Record<string, string> = {
    title: 'div[type="score"] head',
    score: 'div[type="score"]',
    metadata: 'fileDesc',
    text: 'text',
  }

  const sections = Object.entries(selectors)
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
    mei,
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
  const results: ExpressionIndexData[] = []

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

    const indexRefs = Array.from(document.querySelectorAll('[corresp]')).map((el) => ({
      xmlId: el.getAttribute('xml:id'),
      corresp: el.getAttribute('corresp')!.slice(1),
    }))

    results.push({ expressionId, label, indexRefs })
  }

  cachedExpressionIndexRefs = results
  return results
}
