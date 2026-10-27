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
    // Continuations of words split across elements have no moot: the first part shows the whole word.
    const modernizedWord = moot?.getAttribute('word')

    return (
        <Tooltip title={originalWord} placement='top'>
            <span>{modernizedWord}</span>
        </Tooltip>
    )
}
