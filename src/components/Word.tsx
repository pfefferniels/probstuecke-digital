import { Tooltip } from '@mui/material';
import React from 'react'

declare global {
    interface Window { verovio: any; }
}

window.verovio = window.verovio || {};

interface WordProps {
    teiNode: any
}

export const Word = ({ teiNode }: WordProps) => {
    const modernizedWord = teiNode.querySelector('tei-moot')?.getAttribute('word')
    const originalWord = teiNode.textContent

    return (
        <Tooltip title={originalWord} placement='top'>
            <span>{modernizedWord}</span>
        </Tooltip>
    )
}
