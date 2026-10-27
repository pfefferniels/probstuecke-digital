import { Tooltip } from '@mui/material';

if (typeof window !== 'undefined') {
    window.verovio = window.verovio || {};
}

interface WordProps {
    teiNode: Element
}

export const Word = ({ teiNode }: WordProps) => {
    const moot = teiNode.querySelector('tei-moot')
    const originalWord = teiNode.textContent
    // CAB normalises tokens it cannot read (e.g. music symbols) to an empty word: keep
    // the original. Continuations of split words have no moot; the first part shows the whole word.
    const modernizedWord = moot?.getAttribute('word') === '' ? originalWord : moot?.getAttribute('word')

    return (
        <Tooltip title={originalWord} placement='top'>
            <span>{modernizedWord}</span>
        </Tooltip>
    )
}
