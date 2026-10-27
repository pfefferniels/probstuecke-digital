/**
 * The original view shows the accidentals as printed, the modernised view those a modern
 * score needs: accidentals the editors supplied (in <supplied>) belong only to the modernised
 * view, printed ones that a modern score leaves out (in <orig>) only to the original one.
 * Choices are resolved by Verovio; these are removed before rendering, so that they take no
 * room in the layout (hiding them afterwards would leave gaps and change the line breaks).
 */
export const dropHiddenAccidentals = (meiDoc: Document, modern: boolean) => {
    meiDoc
        .querySelectorAll(modern ? 'orig accid' : 'supplied accid')
        .forEach(accid => accid.remove())
}
