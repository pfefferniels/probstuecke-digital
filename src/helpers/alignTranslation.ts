/**
 * Gives a text the sentences of another text it is aligned with, sentence by
 * sentence, or the words where the two differ.
 *
 * The sentences of a translation or of an earlier print point to the sentences
 * of the text that they render or that were made of them
 * (<s corresp="comments_1731.xml#p1-1-s2">). The text that points finds the
 * sentences it points to (pointedTo); the text pointed to finds the sentences
 * that point to it (pointingHere).
 *
 * A translation shows the sentences of its original (interleave): each run of
 * sentences that share sentences of the other text (a German sentence
 * translated as two English ones, say) is wrapped as
 *
 *   <seg type="pair">
 *     <seg type="translation">…the sentences of the text…<seg type="space"/></seg>
 *     <seg type="original" xml:lang="de">…the sentences of the other text…</seg>
 *   </seg>
 *
 * Two prints of the same text mostly agree word for word, so each shows only
 * where the other differs (markDifferences): the words of the aligned sentences
 * are compared, and each passage that differs is wrapped the same way, with the
 * reading of the other print (<seg type="pair" subtype="variant">); a sentence
 * the other print lacks gets a note that it does (subtype="absent").
 *
 * The page sets the other text between the lines, or hides it
 * (components/InterlinearOriginal); the spacer makes room where the other text
 * needs more than this one. The rest of the text (heads, music examples, notes
 * outside the sentences) stays as it is.
 */

const TEI_NS = 'http://www.tei-c.org/ns/1.0'
const XML_NS = 'http://www.w3.org/XML/1998/namespace'

export interface Original {
  document: Document
  /** BCP 47 tag of the original's language */
  lang: string
}

const sentencesOf = (node: Document | Element) => Array.from(node.getElementsByTagNameNS(TEI_NS, 's'))

const onlyWhitespaceBetween = (a: Element, b: Element) => {
  for (let node = a.nextSibling; node && node !== b; node = node.nextSibling) {
    if (node.nodeType !== 3 || node.textContent!.trim() !== '') return false
  }
  return true
}

const seg = (document: Document, type: string) => {
  const el = document.createElementNS(TEI_NS, 'seg')
  el.setAttribute('type', type)
  return el
}

// a copy of a sentence of the other text, without the IDs it has there
const copyOf = (document: Document, sentence: Element) => {
  const copy = document.importNode(sentence, true)
  for (const el of [copy, ...Array.from(copy.getElementsByTagName('*'))]) el.removeAttribute('xml:id')
  return copy
}

/** The sentences of a text that have a counterpart in the other text, with these */
interface Alignment {
  /** in document order */
  sentences: Element[]
  targetsOf: Map<Element, Element[]>
  other: Original
}

/**
 * The sentences of a text that point to those of another (a translation, an
 * earlier print), with the sentences they point to; null if none of them point
 * anywhere.
 */
export const pointedTo = (text: Document, loadOriginal: (file: string) => Original | null): Alignment | null => {
  const sentences = sentencesOf(text).filter((s) => s.hasAttribute('corresp'))

  // the sentences of each original by their ID
  const byId = new Map<Document, Map<string, Element>>()
  const targetsOf = new Map<Element, Element[]>()
  let other: Original | null = null
  for (const s of sentences) {
    const targets: Element[] = []
    for (const token of s.getAttribute('corresp')!.split(/\s+/)) {
      const [file, id] = token.split('#')
      const found = loadOriginal(file)
      if (!found) continue
      if (!byId.has(found.document)) {
        byId.set(found.document, new Map(sentencesOf(found.document).map((x) => [x.getAttribute('xml:id') || '', x])))
      }
      const target = byId.get(found.document)!.get(id)
      if (!target) continue
      targets.push(target)
      other ??= found
    }
    if (targets.length > 0) targetsOf.set(s, targets)
  }
  return other ? { sentences: [...targetsOf.keys()], targetsOf, other } : null
}

/**
 * The sentences of a text that the sentences of another point to (the later
 * print), with these; `pointsHere` tells whether a file named in their
 * @corresp is this text. Null if none of them point to it.
 */
export const pointingHere = (text: Document, pointing: Original, pointsHere: (file: string) => boolean): Alignment | null => {
  // the sentences of the other text by the IDs of the sentences here they point to
  const byTarget = new Map<string, Element[]>()
  for (const s of sentencesOf(pointing.document)) {
    for (const token of (s.getAttribute('corresp') || '').split(/\s+/)) {
      const [file, id] = token.split('#')
      if (!id || !pointsHere(file)) continue
      byTarget.set(id, [...(byTarget.get(id) || []), s])
    }
  }
  const targetsOf = new Map<Element, Element[]>()
  for (const s of sentencesOf(text)) {
    const targets = byTarget.get(s.getAttribute('xml:id') || '')
    if (targets) targetsOf.set(s, targets)
  }
  return targetsOf.size > 0 ? { sentences: [...targetsOf.keys()], targetsOf, other: pointing } : null
}

// the entries of the index of terms that the words of some sentences point to
const termsOf = (sentences: Element[]) => {
  const termIds = new Set<string>()
  for (const sentence of sentences) {
    for (const term of Array.from(sentence.getElementsByTagNameNS(TEI_NS, 'term'))) {
      for (const token of (term.getAttribute('corresp') || '').split(/\s+/)) {
        if (token.startsWith('#')) termIds.add(token.slice(1))
      }
    }
  }
  return [...termIds]
}

/**
 * Rewrites the text in place with the sentences of the other text beneath its
 * own. Returns the other text's expression ID and the entries of the index of
 * terms that its sentences point to.
 */
export const interleave = (text: Document, { sentences, targetsOf, other }: Alignment) => {
  // neighbouring sentences that share a sentence of the other text form a group
  const groups: Element[][] = []
  for (const s of sentences) {
    const group = groups[groups.length - 1]
    const previous = group?.[group.length - 1]
    const joins = previous
      && previous.parentNode === s.parentNode
      && onlyWhitespaceBetween(previous, s)
      && targetsOf.get(s)!.some((target) => group.some((x) => targetsOf.get(x)!.includes(target)))
    if (joins) group.push(s)
    else groups.push([s])
  }

  // a sentence of the other text that belongs to sentences apart (e.g. on either side
  // of a music example) is shown beneath the first of them only
  const shown = new Set<Element>()
  for (const group of groups) {
    const targets = [...new Set(group.flatMap((s) => targetsOf.get(s)!))]
      .filter((target) => !shown.has(target))
      .sort(byPosition)
    targets.forEach((target) => shown.add(target))
    const otherSide = seg(text, 'original')
    otherSide.setAttributeNS(XML_NS, 'xml:lang', other.lang)
    targets.forEach((target, i) => {
      if (i > 0) otherSide.append(' ')
      otherSide.append(copyOf(text, target))
    })
    wrap(text, group[0], group[group.length - 1], targets.length > 0 ? otherSide : null)
  }

  return {
    expressionId: other.document.documentElement.getAttribute('xml:id'),
    termIds: termsOf([...shown]),
  }
}

const byPosition = (a: Node, b: Node) => (a.compareDocumentPosition(b) & 4 ? -1 : 1)

// wraps the nodes from first to last (siblings) as a pair, with the other text
const wrap = (text: Document, first: Node, last: Node, otherSide: Element | null, subtype?: string) => {
  const pair = seg(text, 'pair')
  if (subtype) pair.setAttribute('subtype', subtype)
  const ownSide = seg(text, 'translation')
  first.parentNode!.insertBefore(pair, first)
  for (let node: Node | null = first; node; ) {
    const next: Node | null = node === last ? null : node.nextSibling
    ownSide.append(node)
    node = next
  }
  ownSide.append(seg(text, 'space'))
  pair.append(ownSide)
  if (otherSide) pair.append(otherSide)
}

// ---------------------------------------------------------------------------
// Two prints: the passages where they differ
// ---------------------------------------------------------------------------

/** A word of a print, in its modern form (helpers/normalise wraps each in <w>) */
interface Word {
  /** what is compared: the modern form, spelled loosely (keyOf) */
  key: string
  /** the modern form with the punctuation around it */
  text: string
  /** the <w> elements of the word: more than one where it runs across elements */
  pieces: Element[]
  /** the sentence of the word, among those compared */
  sentence: number
}

// text that is no part of the running text, or a reading that the page does not show
const isAside = (node: Node) => {
  for (let n = node.parentNode; n && n.nodeType === 1; n = n.parentNode) {
    const name = (n as Element).localName
    if (name === 'note' || name === 'fw' || name === 'figure' || name === 'notatedMusic') return true
    if ((name === 'sic' || name === 'abbr' || name === 'orig') && (n.parentNode as Element | null)?.localName === 'choice') return true
  }
  return false
}

// the text beside a node, within its sentence, up to the next element
const textBeside = (node: Node, side: 'previousSibling' | 'nextSibling') => {
  for (let n: Node | null = node; n && (n as Element).localName !== 's'; n = n.parentNode) {
    const sibling = n[side]
    if (sibling) return sibling.nodeType === 3 ? sibling.textContent || '' : ''
  }
  return ''
}

// a word as it is compared: without punctuation, case and the spellings that the
// normalisation leaves apart (moduliret, modulieret; Accorden, Akkorden)
const keyOf = (word: string) =>
  word
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ie/g, 'i')
    .replace(/y/g, 'i')
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/c(?!h)/g, 'k')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .replace(/(.)\1/g, '$1')

// "Gold- und Mittel-Finger": a hyphen before these words ends a truncated compound
const CONJUNCTIONS = new Set(['und', 'oder', 'als', 'noch', 'sowie', 'bis', 'wie'])

const wordsOf = (sentences: Element[]) => {
  const words: Word[] = []
  sentences.forEach((sentence, n) => {
    let first = true
    for (const w of Array.from(sentence.getElementsByTagNameNS(TEI_NS, 'w'))) {
      if (isAside(w)) continue
      const modern = w.getElementsByTagNameNS(TEI_NS, 'moot')[0]?.getAttribute('word')
      // a continuation of the word before, across an element or a line break
      if (modern == null) {
        if (!first) words[words.length - 1].pieces.push(w)
        continue
      }
      // a word broken at the end of a line that the normalisation has not joined ("Or-" / "ganisten")
      const previous = words[words.length - 1]
      if (!first && previous.text.endsWith('-') && /^\p{Ll}/u.test(modern) && !CONJUNCTIONS.has(modern)) {
        previous.text = previous.text.slice(0, -1) + modern
        previous.key = keyOf(previous.text)
        previous.pieces.push(w)
        continue
      }
      const before = textBeside(w, 'previousSibling')
      const leading = first || /\s/.test(before) ? before.match(/[^\s\p{L}\p{N}]*$/u)![0] : ''
      words.push({ key: keyOf(modern), text: leading + modern, pieces: [w], sentence: n })
      first = false
    }
  })
  for (const word of words) word.text += textBeside(word.pieces[word.pieces.length - 1], 'nextSibling').match(/^[^\s\p{L}\p{N}]*/u)![0]
  return words
}

// for each word of a, the index of the same word in b, or -1 (longest common subsequence)
const matchWords = (a: Word[], b: Word[]) => {
  const n = a.length
  const m = b.length
  const lengths = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lengths[i][j] = a[i].key === b[j].key ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }
  const match = new Array<number>(n).fill(-1)
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (a[i].key === b[j].key) match[i++] = j++
    else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++
    else j++
  }
  return match
}

// passages fewer words apart than this in a sentence are shown as one
const NEAR = 3
// where more than this share of the words differ, the whole reading is shown
const REWRITTEN = 0.5
// words of the other print missing here, before the first words here, from this many on
// are shown beneath the whole first sentence
const LONG = 12

// passages that overlap, or lie near each other in a sentence, as one
const merged = (passages: [number, number][], words: Word[]) => {
  const result: [number, number][] = []
  for (const [from, to] of [...passages].sort((a, b) => a[0] - b[0])) {
    const previous = result[result.length - 1]
    if (previous && (from <= previous[1] || (from - previous[1] < NEAR && words[from].sentence === words[previous[1] - 1].sentence))) {
      previous[1] = Math.max(previous[1], to)
    } else result.push([from, to])
  }
  return result
}

// the passages where the words here differ from those of the other print (`match` from
// matchWords), as ranges of the words here [from, to); a passage of words that only one
// of the two has takes in the word before it (or after it), which both have
const differing = (match: number[], others: number, words: Word[]) => {
  const passages: [number, number][] = []
  let from = -1
  let expected = 0
  for (let i = 0; i <= match.length; i++) {
    const j = i < match.length ? match[i] : others
    if (j < 0) {
      if (from < 0) from = i
      continue
    }
    const added = from >= 0
    const left = j > expected
    if (added && left) passages.push([from, i])
    else if (added || left) {
      const start = added ? from : i
      if (start > 0) passages.push([start - 1, i])
      else if (left && j - expected >= LONG) {
        const second = words.findIndex((word) => word.sentence !== words[0].sentence)
        passages.push([0, second < 0 ? words.length : second])
      }
      else if (i < match.length) passages.push([start, i + 1])
    }
    from = -1
    expected = j + 1
  }
  return merged(passages, words)
}

// the elements a range of words [from, to) needs to be wrapped in one piece: the children
// of the common ancestor of its first and last piece that hold them
const span = (words: Word[], from: number, to: number) => {
  const first = words[from].pieces[0]
  const last = words[to - 1].pieces[words[to - 1].pieces.length - 1]
  const ancestors = new Set<Node>()
  for (let n: Node | null = last; n; n = n.parentNode) ancestors.add(n)
  let common: Node = first
  while (!ancestors.has(common)) common = common.parentNode!
  const top = (node: Node) => {
    while (node !== common && node.parentNode !== common) node = node.parentNode!
    return node
  }
  return [top(first), top(last)]
}

// whether a node lies between two siblings (inclusive), or within one of them
const within = (node: Node, [first, last]: Node[]) =>
  (first === node || first.contains(node) || (first.compareDocumentPosition(node) & 4) !== 0)
  && (last === node || last.contains(node) || (last.compareDocumentPosition(node) & 2) !== 0)

// a passage is shown sentence by sentence
const bySentence = (words: Word[], [from, to]: [number, number]) => {
  const parts: [number, number][] = []
  for (let i = from; i < to; i++) {
    if (i === from || words[i].sentence !== words[i - 1].sentence) parts.push([i, i + 1])
    else parts[parts.length - 1][1] = i + 1
  }
  return parts
}

// the sentences of both prints that are compared together: those of a print that share
// sentences of the other, and the sentences these point to or are pointed to by
const groupsOf = (own: Element[], others: Element[], targetsOf: Map<Element, Element[]>) => {
  const parent = new Map<Element, Element>()
  const find = (x: Element): Element => {
    const p = parent.get(x) ?? x
    if (p === x) return x
    const root = find(p)
    parent.set(x, root)
    return root
  }
  for (const s of own) for (const target of targetsOf.get(s) ?? []) parent.set(find(target), find(s))

  const groups = new Map<Element, { own: Element[]; other: Element[] }>()
  for (const s of own) {
    if (!targetsOf.has(s)) continue
    const root = find(s)
    if (!groups.has(root)) groups.set(root, { own: [], other: [] })
    groups.get(root)!.own.push(s)
  }
  // a sentence of the other print without counterpart here is compared with the
  // sentences of the one before it (or after it, at the beginning)
  let last: { own: Element[]; other: Element[] } | undefined
  const unplaced: Element[] = []
  for (const s of others) {
    const group = parent.has(s) ? groups.get(find(s)) : undefined
    if (group) {
      group.other.push(...unplaced.splice(0), s)
      last = group
    } else if (last) last.other.push(s)
    else unplaced.push(s)
  }
  return [...groups.values()]
}

/**
 * Rewrites a print in place with the passages where the other print differs:
 * beneath each, the reading of the other print; beneath a sentence the other
 * print lacks, `absent` ("not in 1719"). Returns null if the prints have no
 * normalised words to compare.
 */
export const markDifferences = (text: Document, { targetsOf, other }: Alignment, absent: string) => {
  if (text.getElementsByTagNameNS(TEI_NS, 'w').length === 0) return null
  const own = sentencesOf(text).filter((s) => !isAside(s))
  const others = sentencesOf(other.document).filter((s) => !isAside(s))

  for (const group of groupsOf(own, others, targetsOf)) {
    const words = wordsOf(group.own)
    const theirs = wordsOf(group.other.sort(byPosition))
    if (words.length === 0) continue
    const match = matchWords(words, theirs)

    let passages = differing(match, theirs.length, words)
    const changed = passages.reduce((sum, [from, to]) => sum + to - from, 0)
    if (changed > words.length * REWRITTEN) passages = [[0, words.length]]

    // a passage that would cut through an element takes in the words of the whole element
    for (let settled = false; !settled; ) {
      settled = true
      for (const piece of passages.flatMap((passage) => bySentence(words, passage))) {
        const nodes = span(words, piece[0], piece[1])
        const covered = words.flatMap((word, i) => (word.pieces.some((p) => within(p, nodes)) ? [i] : []))
        const range: [number, number] = [covered[0], covered[covered.length - 1] + 1]
        if (range[0] < piece[0] || range[1] > piece[1]) {
          passages = merged([...passages, range], words)
          settled = false
          break
        }
      }
    }

    for (const [from, to] of passages) {
      // the words of the other print between the last word before the passage that
      // both have and the first after it
      let before = -1
      for (let i = from - 1; i >= 0 && before < 0; i--) before = match[i]
      let after = -1
      for (let i = to; i < words.length && after < 0; i++) after = match[i]
      const reading = theirs.slice(before + 1, after < 0 ? theirs.length : after).map((word) => word.text).join(' ')

      // the reading stands beneath the beginning of the passage
      bySentence(words, [from, to]).forEach(([start, stop], k) => {
        const [first, last] = span(words, start, stop)
        let otherSide: Element | null = null
        if (k === 0 && reading) {
          otherSide = seg(text, 'original')
          otherSide.setAttributeNS(XML_NS, 'xml:lang', other.lang)
          otherSide.append(reading)
        }
        wrap(text, first, last, otherSide, 'variant')
      })
    }
  }

  // the sentences that the other print lacks
  for (const s of own) {
    if (targetsOf.has(s)) continue
    const note = seg(text, 'original')
    note.setAttribute('rend', 'absent')
    note.append(absent)
    wrap(text, s, s, note, 'absent')
  }

  return {
    expressionId: other.document.documentElement.getAttribute('xml:id'),
    termIds: [],
  }
}
