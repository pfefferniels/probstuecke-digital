import { Tooltip } from '@mui/material';
import { useView } from '@/hooks/useView';

if (typeof window !== 'undefined') {
    window.verovio = window.verovio || {};
}

interface WordProps {
    teiNode: Element
}

/**
 * A word of a print (see helpers/normalise): in its modern form, with the form of the print
 * in a tooltip, or as printed, with the modern form in the tooltip.
 */
export const Word = ({ teiNode }: WordProps) => {
    const view = useView()
    const moot = teiNode.querySelector('tei-moot')
    // whitespace in a word only joins a word broken at the end of a line
    const originalWord = teiNode.textContent?.replace(/\s+/g, '') || ''
    // Continuations of words split across elements have no moot: the first part shows the whole word.
    const modernizedWord = moot?.getAttribute('word')

    if (view === 'diplomatic') {
        // a continuation is part of the word whose first part has the tooltip
        if (!modernizedWord) return <span>{originalWord}</span>
        return (
            <Tooltip title={modernizedWord} placement='top'>
                <span>{originalWord}</span>
            </Tooltip>
        )
    }

    return (
        <Tooltip title={originalWord} placement='top'>
            <span>{modernizedWord}</span>
        </Tooltip>
    )
}
