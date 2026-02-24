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
import type {
  Work,
  WorkExpression,
  WorkKey,
  Person,
  Bibliography,
  MusicalWork,
  Guideline,
  Expression,
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

const modernizeTEI = async (rawXml: string): Promise<string> => {
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

    return modernized.text()
  } catch (e) {
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
let cachedExpressions: Expression[] | null = null

// ---------------------------------------------------------------------------
// loadWorks
// ---------------------------------------------------------------------------

export const loadWorks = async (): Promise<Work[]> => {
  if (cachedWorks) return cachedWorks

  const worksPath = path.join(DATA_DIR, 'works.xml')
  const rawXml = fs.readFileSync(worksPath, 'utf-8')
  const document = parseXml(rawXml)

  const toolkit = await getVerovioToolkit()

  toolkit.setOptions({
    svgViewBox: true,
    footer: 'none',
    adjustPageHeight: true,
    svgAdditionalAttribute: ['measure@facs'],
  })

  const works: Work[] = Array.from(document.querySelectorAll('work')).map((work) => {
    const key = work.querySelector('key')
    const incipitCode = work.querySelector('incip')
    let incipitSvg = ''
    if (incipitCode) {
      toolkit.loadData(incipitCode.textContent!.trim())
      incipitSvg = toolkit.renderToSVG(1)
    }

    const expressions: WorkExpression[] = Array.from(work.querySelectorAll('expression')).map(
      (expression) => {
        const date =
          expression.querySelector('creation')?.getAttribute('startdate') || '[unknown]'
        const type = expression.getAttribute('type') || '[unknown]'
        const lang = expression.querySelector('language')?.textContent || 'German'
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
          author,
        }
      }
    )

    const keyObj: WorkKey = key
      ? Array.from(key.attributes).reduce((obj: Record<string, string>, attr) => {
          obj[attr.name] = attr.value
          return obj
        }, {})
      : {}

    return {
      xmlId: work.getAttribute('xml:id'),
      title: work.querySelector('title')?.textContent || '[no title]',
      incipitSvg,
      key: keyObj,
      expressions,
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
    return {
      xmlId: person.getAttribute('xml:id') || 'no-id',
      surname: person.querySelector('surname')?.textContent || '',
      forename: person.querySelector('forename')?.textContent || '',
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
// Expression processing (core logic ported from gatsby-node onCreateNode)
// ---------------------------------------------------------------------------

const SPECIAL_TEI_TYPES = new Set(['persons', 'bibliography', 'musical-works', 'guideline'])

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
        with: transformToCeteicean(extract.with!),
      }
    })
    .reduce((prev: Record<string, TransformedTEI>, curr) => {
      prev[curr.fill] = curr.with
      return prev
    }, {})

  return {
    expressionId: metadata.expressionId,
    isFraktur: metadata.isFraktur,
    label: metadata.label,
    score: (sections.score as TransformedTEI) || null,
    title: (sections.title as TransformedTEI) || null,
    text: (sections.text as TransformedTEI) || null,
    mei,
    zones,
    refTargets,
    indexRefs,
  }
}

// ---------------------------------------------------------------------------
// loadExpressions
// ---------------------------------------------------------------------------

export const loadExpressions = async (): Promise<Expression[]> => {
  if (cachedExpressions) return cachedExpressions

  const allXmlFiles = findXmlFiles(DATA_DIR)
  const expressions: Expression[] = []

  for (const filePath of allXmlFiles) {
    const expression = await processExpressionFile(filePath)
    if (expression) {
      expressions.push(expression)
    }
  }

  cachedExpressions = expressions
  return expressions
}

// ---------------------------------------------------------------------------
// loadExpression
// ---------------------------------------------------------------------------

export const loadExpression = async (
  expressionId: string
): Promise<Expression | undefined> => {
  const expressions = await loadExpressions()
  return expressions.find((e) => e.expressionId === expressionId)
}

// ---------------------------------------------------------------------------
// loadExpressionIndexRefs
// ---------------------------------------------------------------------------

export const loadExpressionIndexRefs = async (): Promise<ExpressionIndexData[]> => {
  const expressions = await loadExpressions()
  return expressions.map((e) => ({
    expressionId: e.expressionId,
    label: e.label,
    indexRefs: e.indexRefs,
  }))
}
