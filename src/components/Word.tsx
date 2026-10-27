import { Tooltip } from '@mui/material';

if (typeof window !== 'undefined') {
    window.verovio = window.verovio || {};
}

interface WordProps {
    teiNode: Element
}

export const Word = ({ teiNode }: WordProps) => {
    // CAB leaves tokens it cannot normalise (e.g. music symbols) empty
    const modernizedWord = teiNode.querySelector('tei-moot')?.getAttribute('word')
    const originalWord = teiNode.textContent

    return (
        <Tooltip title={originalWord} placement='top'>
            <span>{modernizedWord || originalWord}</span>
        </Tooltip>
    )
}
