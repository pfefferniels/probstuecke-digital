/**
 * A score can hold a piece more than once, e.g. notated a second time in another key,
 * each in its own <mdiv>. Verovio draws one <mdiv> at a time.
 */

/** The <mdiv>s directly in the <body> of an MEI document */
export const topLevelMdivs = (meiDoc: Document): Element[] =>
    Array
        .from(meiDoc.querySelector('music > body')?.children || [])
        .filter(el => el.localName === 'mdiv')

/** What to call the <mdiv> with the given index */
export const mdivLabel = (mdiv: Element, index: number) =>
    mdiv.getAttribute('label') || `${index + 1}`

/** Verovio's `mdivXPathQuery` for the <mdiv> with the given index in `topLevelMdivs` */
export const mdivXPathQuery = (index: number) => `./mdiv[${index + 1}]`
