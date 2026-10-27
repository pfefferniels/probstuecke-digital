/**
 * Music examples have no bar numbers of their own. A bar that quotes the piece
 * carries the number of the quoted bar as @label (derived in the data from its
 * @corresp). Verovio numbers bars by @n, so in an example with such labels the
 * labels become the numbers, the other bars lose theirs, and the numbers are
 * made visible; as in the main score, each system starts with the number of its
 * first bar. Other music (the arias, Robert Hill's excerpts) keeps its own
 * numbering.
 */
export const showPieceBarNumbers = (meiDoc: Document) => {
    const measures = Array.from(meiDoc.querySelectorAll('measure'))
    if (!measures.some(measure => measure.hasAttribute('label'))) return

    measures.forEach(measure => {
        const label = measure.getAttribute('label')
        if (label) measure.setAttribute('n', label)
        else measure.removeAttribute('n')
    })
    meiDoc.querySelectorAll('scoreDef').forEach(scoreDef => scoreDef.removeAttribute('mnum.visible'))
}
