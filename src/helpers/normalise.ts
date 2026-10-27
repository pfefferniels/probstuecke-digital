/**
 * Normalises the diplomatic transcriptions for display, without any external
 * service. Words are looked up in the edition's lexicon
 * (probstuecke-data/normalisation/lexicon.tsv); other words only get the
 * character rules, as do names and foreign words. See
 * probstuecke-data/normalisation/README.md.
 *
 * Every word is wrapped in <w><moot word="modern form"/>original</w>, the
 * structure the Word component renders. A word that runs across elements
 * (e.g. a decorated initial, or a hyphenated line break) is wrapped piece by
 * piece; only the first piece carries the modern form.
 */

export type Lexicon = Map<string, string>

const TEI_NS = 'http://www.tei-c.org/ns/1.0'

export const parseLexicon = (tsv: string): Lexicon => {
  const lexicon: Lexicon = new Map()
  for (const line of tsv.split('\n').slice(1)) {
    const [orig, norm] = line.split('\t')
    if (orig && norm) lexicon.set(orig, norm)
  }
  return lexicon
}

const UMLAUTS: Record<string, string> = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' }

// the nasal bar abbreviates a doubled consonant or a following n: kom̃en, genañten, Sachẽ
const NASAL: Record<string, string> = { m: 'mm', n: 'nn', e: 'en' }

export const characterRules = (word: string) =>
  word
    .replace(/ſ/g, 's')
    .replace(/([aouAOU])ͤ/g, (_, vowel: string) => UMLAUTS[vowel])
    .replace(/ñ/g, 'nn')
    .replace(/ẽ/g, 'en')
    .replace(/([mne])\u0303/g, (_, letter: string) => NASAL[letter])

// left as they are
const SKIP = new Set(['teiHeader', 'facsimile', 'g'])
// a word may continue across the boundaries of these elements
const INLINE = new Set([
  'hi', 'ref', 'persName', 'placeName', 'orgName', 'name', 'rs', 'title', 'bibl', 'foreign',
  'abbr', 'expan', 'supplied', 'unclear', 'add', 'del', 'subst', 'q', 'quote', 'num', 'date',
  'measure', 'seg', 'term', 'mentioned', 'emph', 'soCalled', 'surname', 'forename',
  'roleName', 'addName', 'gap', 'damage',
])
// line and page breaks: a hyphen before them joins the word with the next line
const LINE_BREAKS = new Set(['lb', 'pb', 'cb'])
// milestones that do not interrupt a word
const TRANSPARENT = new Set(['milestone', 'anchor'])
// "Gold- und Mittel-Finger": a hyphen before these words ends a truncated compound
const CONJUNCTIONS = new Set(['und', 'oder', 'als', 'noch', 'sowie', 'ſowie', 'bis', 'biß', 'wie'])
// inserted texts that interrupt the running text without ending a word
const INSERTED = new Set(['fw', 'note'])

interface Char {
  char: string
  node: Text | null // null: a break between words
  offset: number
  // in a name or a foreign language: only the character rules apply
  plain: boolean
  // whitespace between a line-end hyphen and the next line, not part of the word
  joined?: boolean
  // a line-end hyphen; dropped from the lookup unless the next line starts with a capital
  lineEndHyphen?: boolean
}

interface Piece {
  start: number
  end: number
  word?: string // modern form, on the first piece of a word only
}

const BREAK: Char = { char: ' ', node: null, offset: 0, plain: false }
const isWordChar = (c: string) => /[\p{L}\p{M}\p{N}]/u.test(c)

const followingWord = (run: Char[], from: number) => {
  let word = ''
  for (let k = from; k < run.length && run[k].node && isWordChar(run[k].char); k++) word += run[k].char
  return word
}

// a compound that is not listed as a whole is looked up part by part ("Dreyling-Lichter")
const lookup = (key: string, lexicon: Lexicon): string =>
  lexicon.get(key) ??
  (key.includes('-')
    ? key.split('-').map(part => lexicon.get(part) ?? characterRules(part)).join('-')
    : characterRules(key))

const isPlain = (el: Element, inherited: boolean) => {
  if (el.localName === 'foreign' || el.localName === 'persName') return true
  const lang = el.getAttribute('xml:lang')
  return lang ? !lang.startsWith('de') : inherited
}

/** Collects the characters of the text in reading order, one list per run of text. */
const collectRuns = (text: Element): Char[][] => {
  const runs: Char[][] = []
  // runs that just had a line-end hyphen: whitespace up to the next line belongs to the word
  const joining = new Set<Char[]>()

  const pushBreak = (run: Char[]) => {
    joining.delete(run)
    run.push(BREAK)
  }

  const walk = (node: Node, run: Char[], plain: boolean) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) {
        const value = child.nodeValue || ''
        for (let i = 0; i < value.length; i++) {
          const char = value[i]
          const whitespace = /\s/.test(char)
          const joined = whitespace && joining.has(run)
          if (!whitespace) joining.delete(run)
          run.push({ char, node: child as Text, offset: i, plain, joined })
        }
        continue
      }
      if (child.nodeType !== 1) continue

      const el = child as Element
      const name = el.localName
      const childPlain = isPlain(el, plain)

      if (SKIP.has(name)) {
        pushBreak(run)
      }
      else if (name === 'note' && el.getAttribute('type') === 'editorial') {
        // the editors' notes are in modern spelling
        continue
      }
      else if (LINE_BREAKS.has(name)) {
        // a hyphen at the end of the line joins the word with the next line
        let i = run.length - 1
        while (i >= 0 && run[i].node && /\s/.test(run[i].char)) i--
        if (i > 0 && run[i].char === '-' && isWordChar(run[i - 1].char)) {
          run[i].lineEndHyphen = true
          for (let j = i + 1; j < run.length; j++) run[j].joined = true
          joining.add(run)
        }
        else if (name === 'lb') {
          pushBreak(run)
        }
      }
      else if (TRANSPARENT.has(name)) {
        continue
      }
      else if (INSERTED.has(name)) {
        // a footnote in a foreign quotation is still in German unless it says otherwise
        const inserted: Char[] = []
        walk(el, inserted, isPlain(el, false))
        runs.push(inserted)
      }
      else if (name === 'choice') {
        for (const alternative of Array.from(el.children)) {
          pushBreak(run)
          walk(alternative, run, childPlain)
          pushBreak(run)
        }
      }
      else if (INLINE.has(name)) {
        walk(el, run, childPlain)
      }
      else {
        pushBreak(run)
        walk(el, run, childPlain)
        pushBreak(run)
      }
    }
  }

  const main: Char[] = []
  walk(text, main, false)
  runs.push(main)
  return runs
}

/** Splits a run into words and records, per text node, which ranges to wrap. */
const findWords = (run: Char[], lexicon: Lexicon, pieces: Map<Text, Piece[]>) => {
  // whitespace after a line-end hyphen belongs to the word but is not looked up
  const inWord = (c: Char) => c.node !== null && (isWordChar(c.char) || c.joined === true)

  let i = 0
  while (i < run.length) {
    if (!(run[i].node && isWordChar(run[i].char))) {
      i++
      continue
    }

    let end = i
    for (;;) {
      while (end < run.length && inWord(run[end])) end++
      const next = run[end]
      // word-internal hyphens and apostrophes; a hyphen at the end of a line joins
      if (next && next.node && /[-'’]/.test(next.char)) {
        let k = end + 1
        while (k < run.length && run[k].joined) k++
        // the print may repeat the hyphen at the start of the next line ("Prob-" / "-Stück")
        if (next.lineEndHyphen && run[k]?.node && run[k].char === '-') k++
        const continues = k < run.length && run[k].node && isWordChar(run[k].char)
        if (continues && !(next.lineEndHyphen && CONJUNCTIONS.has(followingWord(run, k)))) {
          end = k
          continue
        }
        // truncated compound ("Unglücks- als Glücks-Fälle")
        if (next.char === '-') end++
      }
      break
    }
    // don't end on whitespace that belongs to a line break
    while (end > i && run[end - 1].joined) end--

    let key = ''
    for (let k = i; k < end; k++) {
      const c = run[k]
      if (c.joined) continue
      if (c.lineEndHyphen) {
        // dropped before a lower-case continuation or a repeated hyphen, kept before a capital
        const nextChar = run.slice(k + 1, end).find(n => !n.joined)
        if (nextChar && nextChar.char === nextChar.char.toLowerCase()) continue
      }
      key += c.char
    }

    // abbreviations ("pag.", "ꝛc.") and "&c"
    let start = i
    if (run[end]?.char === '.' && run[end].node && lexicon.has(key + '.')) {
      key += '.'
      end++
    }
    if (i > 0 && run[i - 1].char === '&' && run[i - 1].node && lexicon.has('&' + key)) {
      key = '&' + key
      start = i - 1
    }

    // abbreviations such as "&c" are expanded in any language
    const abbreviation = key.startsWith('&') || key.endsWith('.')
    const word = run[i].plain && !abbreviation
      ? characterRules(key)
      : lookup(key, lexicon)

    let first = true
    let k = start
    while (k < end) {
      const node = run[k].node
      if (!node) {
        k++
        continue
      }
      const from = run[k].offset
      while (k + 1 < end && run[k + 1].node === node && run[k + 1].offset === run[k].offset + 1) k++
      const list = pieces.get(node) ?? []
      list.push({ start: from, end: run[k].offset + 1, word: first ? word : undefined })
      pieces.set(node, list)
      first = false
      k++
    }
    i = end
  }
}

/** Wraps every word of the text in <w>, with its modern form in <moot word="…"/>. */
export const normaliseDocument = (document: Document, lexicon: Lexicon) => {
  const text = document.getElementsByTagNameNS(TEI_NS, 'text')[0]
  if (!text) return

  const pieces = new Map<Text, Piece[]>()
  for (const run of collectRuns(text)) findWords(run, lexicon, pieces)

  for (const [node, list] of pieces) {
    const value = node.nodeValue || ''
    const fragment = document.createDocumentFragment()
    let position = 0
    for (const piece of list.sort((a, b) => a.start - b.start)) {
      if (piece.start > position) fragment.appendChild(document.createTextNode(value.slice(position, piece.start)))
      const w = document.createElementNS(TEI_NS, 'w')
      if (piece.word !== undefined) {
        const moot = document.createElementNS(TEI_NS, 'moot')
        moot.setAttribute('word', piece.word)
        w.appendChild(moot)
      }
      w.appendChild(document.createTextNode(value.slice(piece.start, piece.end)))
      fragment.appendChild(w)
      position = piece.end
    }
    if (position < value.length) fragment.appendChild(document.createTextNode(value.slice(position)))
    node.parentNode?.replaceChild(fragment, node)
  }
}
