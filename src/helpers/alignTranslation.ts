/**
 * Gives a translation the sentences of its original, sentence by sentence.
 *
 * The sentences of the translation point to the sentences of the original
 * that they render (<s corresp="comments_de.xml#p1-1-s2">). Each run of
 * sentences that render the same sentences of the original (a German sentence
 * translated as two English ones, say) is wrapped as
 *
 *   <seg type="pair">
 *     <seg type="translation">…the sentences of the translation…<seg type="space"/></seg>
 *     <seg type="original" xml:lang="de">…the sentences of the original…</seg>
 *   </seg>
 *
 * so that the page can set the original between the lines of the
 * translation, or hide it (components/InterlinearOriginal); the spacer makes
 * room where the original needs more than its translation. The rest of the
 * text (heads, music examples, notes outside the sentences) stays as it is.
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

/**
 * Rewrites the translation (a TEI document or its <text>) in place. Returns
 * the original's expression ID and the entries of the index of terms that its
 * sentences point to, or null if the translation has no aligned sentences.
 */
export const alignTranslation = (
  translation: Document,
  loadOriginal: (file: string) => Original | null
) => {
  const sentences = sentencesOf(translation).filter((s) => s.hasAttribute('corresp'))
  if (sentences.length === 0) return null

  // the sentences of each original by their ID
  const byId = new Map<Document, Map<string, Element>>()
  const targetsOf = new Map<Element, Element[]>()
  let original: Original | null = null
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
      original ??= found
    }
    targetsOf.set(s, targets)
  }
  if (!original) return null

  // neighbouring sentences that share a sentence of the original form a group
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
  for (const group of groups) {
    const pair = seg(translation, 'pair')
    const originalSide = seg(translation, 'original')
    originalSide.setAttributeNS(XML_NS, 'xml:lang', original.lang)
    const translationSide = seg(translation, 'translation')
    group[0].before(pair)

    const targets = [...new Set(group.flatMap((s) => targetsOf.get(s)!))]
      .sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1))
    targets.forEach((target, i) => {
      if (i > 0) originalSide.append(' ')
      originalSide.append(translation.importNode(target, true))
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
    translationSide.append(seg(translation, 'space'))
    pair.append(translationSide, originalSide)
  }

  return {
    expressionId: original.document.documentElement.getAttribute('xml:id'),
    termIds: [...termIds],
  }
}
