import { useView } from '@/hooks/useView'

// elements that stand apart from the running text: a line that begins with or after one
// has no line before it to end
const BLOCKS = new Set([
    'tei-text', 'tei-body', 'tei-front', 'tei-back', 'tei-div', 'tei-head', 'tei-p', 'tei-ab',
    'tei-list', 'tei-item', 'tei-lg', 'tei-l', 'tei-table', 'tei-row', 'tei-cell',
    'tei-figure', 'tei-notatedmusic', 'tei-note', 'tei-sp', 'tei-speaker', 'tei-stage',
])

// not on the line: notes, catchwords and the other text between the lines (helpers/alignTranslation)
const skipped = (el: Element) => {
    const name = el.localName.toLowerCase()
    return name === 'tei-note' || name === 'tei-fw' || (name === 'tei-seg' && el.getAttribute('type') === 'original')
}

const isBlock = (el: Element) => BLOCKS.has(el.localName.toLowerCase())
const isBreak = (el: Element) => ['tei-lb', 'tei-pb', 'tei-cb'].includes(el.localName.toLowerCase())

type Last = 'text' | 'break' | 'nothing'

// what comes last in an element on the line: text, a break, or nothing at all
const lastIn = (node: Node): Last => {
    if (node.nodeType === Node.TEXT_NODE) return /\S/.test(node.nodeValue || '') ? 'text' : 'nothing'
    if (node.nodeType !== Node.ELEMENT_NODE) return 'nothing'
    const el = node as Element
    if (isBreak(el) || isBlock(el)) return 'break'
    if (skipped(el)) return 'nothing'
    for (let child = el.lastChild; child; child = child.previousSibling) {
        const last = lastIn(child)
        if (last !== 'nothing') return last
    }
    return 'nothing'
}

// whether a line of the print ends here: there is text before the line break in its paragraph
// (or heading, …), and no page break in between, which takes its place
const endsALine = (lb: Element) => {
    let node: Node = lb
    for (;;) {
        while (!node.previousSibling) {
            const parent = node.parentNode
            if (!parent || parent.nodeType !== Node.ELEMENT_NODE || isBlock(parent as Element)) return false
            node = parent
        }
        node = node.previousSibling
        const last = lastIn(node)
        if (last !== 'nothing') return last === 'text'
    }
}

// whether the line breaks in the middle of a word: the next word goes on with the one
// before it (the continuation of a word has no modern form, see helpers/normalise)
const inWord = (lb: Element) => {
    const walker = lb.ownerDocument.createTreeWalker(lb.ownerDocument, NodeFilter.SHOW_ELEMENT)
    walker.currentNode = lb
    for (let el = walker.nextNode() as Element | null; el; el = walker.nextNode() as Element | null) {
        if (el.localName.toLowerCase() !== 'tei-w' || el.closest('tei-seg[type="original"]')) continue
        return !el.querySelector('tei-moot')
    }
    return false
}

/**
 * The beginning of a line of a print (<lb/>, which TEI places at the start of a line). In the
 * diplomatic view, the end of the line before it is marked with a vertical stroke, as in critical
 * editions: "Zeiten | mit", within a word "an-|ſchlagen".
 */
export const LineBreak = ({ teiNode }: { teiNode: Element }) => {
    const view = useView()
    if (view !== 'diplomatic' || !endsALine(teiNode)) return null
    // the other text between the lines keeps to its sentences
    if (teiNode.closest('tei-seg[type="original"]')) return null

    return (
        <span className="lineBreak" title="Line break in the print" aria-hidden="true">
            {inWord(teiNode) ? '|' : ' | '}
        </span>
    )
}
