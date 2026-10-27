/**
 * Verovio's `appXPathQuery` for the readings of the source that the given text
 * (TEI expression) belongs to, if the encoding names one. Where an <app> has no
 * reading of that source, Verovio takes the <lem>.
 */
export const readingsXPathQuery = (meiDoc: Document, expressionId: string | undefined) => {
    if (!expressionId) return undefined
    const sourceId = Array
        .from(meiDoc.querySelectorAll('source[corresp]'))
        .find(source => source.getAttribute('corresp')!.split(/\s+/).includes(`#${expressionId}`))
        ?.getAttribute('xml:id')
    if (!sourceId) return undefined
    return `./*[contains(concat(' ', @source, ' '), ' #${sourceId} ')]`
}
