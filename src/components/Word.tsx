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

    return (
        <span>{modernizedWord}</span>
    )
}
