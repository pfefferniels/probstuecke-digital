/**
 * Gives a text the sentences of another text that correspond to its own,
 * sentence by sentence.
 *
 * The sentences of a translation point to the sentences of the original that
 * they render (<s corresp="comments_1731.xml#p1-1-s2">), and those of the 1719
 * print to the sentences that Mattheson made of them in 1731. The text that
 * points gets the sentences it points to (alignTranslation); the 1731 print,
 * which is pointed to, gets the sentences of the 1719 print that point to its
 * own (alignPointedTo). Each run of sentences that share sentences of the other
 * text (a German sentence translated as two English ones, say) is wrapped as
 *
 *   <seg type="pair">
 *     <seg type="translation">…the sentences of the text…<seg type="space"/></seg>
 *     <seg type="original" xml:lang="de">…the sentences of the other text…</seg>
 *   </seg>
 *
 * so that the page can set the other text between the lines of its own, or
 * hide it (components/InterlinearOriginal); the spacer makes room where the
 * other text needs more than its own. The segments are named after the first
 * use, a translation and its original. The rest of the text (heads, music
 * examples, notes outside the sentences) stays as it is.
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

// a copy of a sentence of the other text, without its IDs, which the page has for its own sentences
const copyOf = (document: Document, sentence: Element) => {
  const copy = document.importNode(sentence, true)
  for (const el of [copy, ...Array.from(copy.getElementsByTagName('*'))]) el.removeAttributeNS(XML_NS, 'id')
  return copy
}

/**
 * Wraps the sentences of a text with the sentences of the other text that
 * correspond to them. Returns the entries of the index of terms that the
 * sentences of the other text point to.
 */
const pairUp = (document: Document, sentences: Element[], targetsOf: Map<Element, Element[]>, lang: string) => {
  // neighbouring sentences that share a sentence of the other text form a group
  const groups: Element[][] = []
  for (const s of sentences) {
    const group = groups[groups.length - 1]
    const previous = group?.[group.length - 1]
    const joins = previous
      && previous.parentNode === s.parentNode
      && onlyWhitespaceBetween(previous, s)
      && targetsOf.get(s)!.some((target) => group.some((other) => targetsOf.get(other)!.includes(target)))
    if (joins) group.push(s)
    else groups.push([s])
  }

  const termIds = new Set<string>()
  // a sentence of the other text that corresponds to sentences apart (e.g. on either
  // side of a music example) is shown beneath the first of them only
  const shown = new Set<Element>()
  for (const group of groups) {
    const pair = seg(document, 'pair')
    const originalSide = seg(document, 'original')
    originalSide.setAttributeNS(XML_NS, 'xml:lang', lang)
    const translationSide = seg(document, 'translation')
    group[0].before(pair)

    const targets = [...new Set(group.flatMap((s) => targetsOf.get(s)!))]
      .filter((target) => !shown.has(target))
      .sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1))
    targets.forEach((target) => shown.add(target))
    targets.forEach((target, i) => {
      if (i > 0) originalSide.append(' ')
      originalSide.append(copyOf(document, target))
      for (const term of Array.from(target.getElementsByTagNameNS(TEI_NS, 'term'))) {
        for (const token of (term.getAttribute('corresp') || '').split(/\s+/)) {
          if (token.startsWith('#')) termIds.add(token.slice(1))
        }
      }
    })
    group.forEach((s, i) => {
      if (i > 0) translationSide.append(' ')
      translationSide.append(s)
    })
    translationSide.append(seg(document, 'space'))
    pair.append(translationSide)
    if (targets.length > 0) pair.append(originalSide)
  }
  return [...termIds]
}

/**
 * Rewrites a text whose sentences point to those of another (a translation, or
 * the 1719 print; a TEI document or its <text>) in place. Returns the other
 * text's expression ID and the entries of the index of terms that its
 * sentences point to, or null if the text has no aligned sentences.
 */
export const alignTranslation = (
  translation: Document,
  loadOriginal: (file: string) => Original | null
) => {
  const sentences = sentencesOf(translation)
  if (!sentences.some((s) => s.hasAttribute('corresp'))) return null

  // the sentences of each original by their ID
  const byId = new Map<Document, Map<string, Element>>()
  const targetsOf = new Map<Element, Element[]>()
  let original: Original | null = null
  for (const s of sentences) {
    const targets: Element[] = []
    for (const token of (s.getAttribute('corresp') || '').split(/\s+/).filter(Boolean)) {
      const [file, id] = token.split('#')
      const found = loadOriginal(file)
      if (!found) continue
      if (!byId.has(found.document)) {
        byId.set(found.document, new Map(sentencesOf(found.document).map((x) => [x.getAttribute('xml:id') || '', x])))
      }
      const target = byId.get(found.document)!.get(id)
      if (!target) continue
      targets.push(target)
      original ??= found
    }
    targetsOf.set(s, targets)
  }
  if (!original) return null

  return {
    expressionId: original.document.documentElement.getAttribute('xml:id'),
    termIds: pairUp(translation, sentences, targetsOf, original.lang),
  }
}

/**
 * Rewrites a text whose sentences another text points to (the 1731 print, to
 * which the 1719 print points) in place. `idOf` gives the ID of the sentence
 * of this text that a pointer of the other text names, or null if it names
 * another text. Returns the other text's expression ID and the entries of the
 * index of terms that its sentences point to, or null if none of its
 * sentences points here.
 */
export const alignPointedTo = (
  text: Document,
  other: Original,
  idOf: (token: string) => string | null
) => {
  const sentences = sentencesOf(text)
  const byId = new Map(sentences.map((s) => [s.getAttribute('xml:id') || '', s]))
  const targetsOf = new Map(sentences.map((s) => [s, [] as Element[]]))
  let found = false
  for (const s of sentencesOf(other.document)) {
    for (const token of (s.getAttribute('corresp') || '').split(/\s+/).filter(Boolean)) {
      const id = idOf(token)
      const own = id === null ? undefined : byId.get(id)
      if (!own || targetsOf.get(own)!.includes(s)) continue
      targetsOf.get(own)!.push(s)
      found = true
    }
  }
  if (!found) return null

  return {
    expressionId: other.document.documentElement.getAttribute('xml:id'),
    termIds: pairUp(text, sentences, targetsOf, other.lang),
  }
}
