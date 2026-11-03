import { useView } from '@/hooks/useView';

if (typeof window !== 'undefined') {
    window.verovio = window.verovio || {};
}

interface WordProps {
    teiNode: Element
}

/** A word of a print (see helpers/normalise): in its modern form, or as printed */
export const Word = ({ teiNode }: WordProps) => {
    const view = useView()

    // as printed; whitespace in a word only joins a word broken at the end of a line
    if (view !== 'modern') return teiNode.textContent?.replace(/\s+/g, '') || null

    // Continuations of words split across elements have no moot: the first part shows the whole word.
    return teiNode.querySelector('tei-moot')?.getAttribute('word') || null
}
