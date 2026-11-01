/**
 * The ID of the source (<source>) that the given text (TEI expression) belongs to,
 * if the encoding names one.
 */
export const sourceOf = (meiDoc: Document, expressionId: string | undefined) => {
    if (!expressionId) return undefined
    return Array
        .from(meiDoc.querySelectorAll('source[corresp]'))
        .find(source => source.getAttribute('corresp')!.split(/\s+/).includes(`#${expressionId}`))
        ?.getAttribute('xml:id') ?? undefined
}

/** Verovio's `appXPathQuery` for the readings of the source with the given ID */
export const readingsOfSource = (sourceId: string) =>
    `./*[contains(concat(' ', @source, ' '), ' #${sourceId} ')]`

/**
 * Verovio's `appXPathQuery` for the readings of the source that the given text
 * (TEI expression) belongs to, if the encoding names one. Where an <app> has no
 * reading of that source, Verovio takes the <lem>.
 */
export const readingsXPathQuery = (meiDoc: Document, expressionId: string | undefined) => {
    const sourceId = sourceOf(meiDoc, expressionId)
    return sourceId ? readingsOfSource(sourceId) : undefined
}
