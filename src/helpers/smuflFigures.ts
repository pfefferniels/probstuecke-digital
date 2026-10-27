const MEI_NS = 'http://www.music-encoding.org/ns/mei'

// SMuFL figured bass glyphs for raised figures (a figure with a stroke, e.g. the raised sixth)
const RAISED: Record<string, string> = {
    '2': '', // figbass2Raised
    '4': '', // figbass4Raised
    '5': '', // figbass5Raised1
    '6': '', // figbass6Raised
    '7': '', // figbass7Raised1
    '9': '', // figbass9Raised
}

/**
 * Raised figures are transcribed as a digit with a combining reverse solidus overlay
 * (6⃥). The text fonts have no glyph for it (browsers fall back to some other font, PDFs
 * show a box), so they are drawn with the SMuFL glyph from the music font instead.
 */
export const smuflFigures = (meiDoc: Document) => {
    for (const f of Array.from(meiDoc.getElementsByTagNameNS(MEI_NS, 'f'))) {
        for (const node of Array.from(f.childNodes)) {
            if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue) continue
            node.nodeValue = node.nodeValue.replace(/(\d)⃥/g, (raised, digit: string) => RAISED[digit] ?? raised)
        }
    }
}
