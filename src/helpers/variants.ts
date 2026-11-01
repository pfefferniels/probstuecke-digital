/**
 * Where the two prints differ in the music. The encodings give the readings of the
 * prints in <app>s (<lem> and <rdg> with @source), and Verovio draws those of the print
 * a page is about (helpers/readings). Here the <app>s are found in which the other
 * print has another reading, so that the page can mark these passages and show the
 * other print's reading of their bars (components/NotatedMusic).
 *
 * Where this print has nothing and the other has something (a figure, an ornament, a
 * direction), the other print's reading is drawn in its place, grey, as the text of the
 * other print stands grey between the lines of a print; where it has nothing in a layer
 * (or only a <space>, or an accidental that is not printed), a small mark stands above
 * the staff instead.
 */

const MEI_NS = 'http://www.music-encoding.org/ns/mei'
const XML_NS = 'http://www.w3.org/XML/1998/namespace'

export interface Variant {
    /** IDs of the elements drawn for this print's reading, or of what stands in for it */
    ids: string[]
    /** IDs of the elements of the other print's reading */
    otherIds: string[]
    /** ID of the bar the passage stands in */
    measure: string
    /** this print has nothing here: what is drawn stands in for the other print's reading */
    standIn: boolean
    /** the other print has nothing here */
    notInOther: boolean
}

const idOf = (el: Element) => el.getAttribute('xml:id')

const withId = (el: Element, id: string) => {
    if (!idOf(el)) el.setAttributeNS(XML_NS, 'xml:id', id)
    return idOf(el)!
}

const elementsOf = (el: Element) => Array.from(el.getElementsByTagName('*'))

const hasSource = (reading: Element, sourceId: string) =>
    (reading.getAttribute('source') || '').split(/\s+/).includes(`#${sourceId}`)

// the reading Verovio draws for a source: the source's own, else the <lem>, else the first <rdg>
const readingOf = (app: Element, sourceId: string) => {
    const readings = Array.from(app.children).filter(child => child.localName === 'lem' || child.localName === 'rdg')
    return readings.find(reading => hasSource(reading, sourceId))
        ?? readings.find(reading => reading.localName === 'lem')
        ?? readings[0]
}

// a <space> takes time in its layer but draws nothing, nor does an accidental that is
// only sounded (@accid.ges)
const drawsNothing = (el: Element) => el.localName === 'space' || (el.localName === 'accid' && !el.hasAttribute('accid'))
const draws = (reading: Element | undefined) => !!reading && elementsOf(reading).some(el => !drawsNothing(el))

const TIMED = ['note', 'chord', 'rest', 'space', 'mRest']

// an element of a layer that a direction can start at: the element itself, or the first in it
const timedIn = (el: Element | null | undefined) => !el
    ? null
    : TIMED.includes(el.localName) ? el : elementsOf(el).find(child => TIMED.includes(child.localName)) ?? null

/**
 * The passages of the music under `root` (the <mdiv> drawn) in which the print with
 * the source `otherSourceId` has another reading than the one with `sourceId`. The
 * elements of both readings are given IDs (prefixed with `prefix`, which keeps them
 * apart from those of other scores on the page).
 *
 * `addStandIns` then puts the stand-ins into the encoding: call it after the encoding
 * has been taken for drawing the other print's readings, which have no stand-ins.
 */
export const findVariants = (root: Element, sourceId: string, otherSourceId: string, prefix: string) => {
    const variants: Variant[] = []
    const standIns: (() => void)[] = []
    const document = root.ownerDocument

    for (const app of Array.from(root.getElementsByTagNameNS(MEI_NS, 'app'))) {
        // an <app> in a reading of another <app> is left to that one
        if (app.parentElement?.closest('app')) continue
        const own = readingOf(app, sourceId)
        const other = readingOf(app, otherSourceId)
        // what is not in a bar (e.g. a heading of the page) is not drawn
        const measure = app.closest('measure')
        if (!own || !other || own === other || !measure) continue
        if (!draws(own) && !draws(other)) continue

        const name = `${prefix}-variant-${variants.length}`
        withId(measure, `${name}-measure`)
        const idsIn = (reading: Element, part: string) =>
            elementsOf(reading).map((el, k) => withId(el, `${name}-${part}-${k}`))

        const variant: Variant = {
            ids: idsIn(own, 'own'),
            otherIds: idsIn(other, 'other'),
            measure: idOf(measure)!,
            standIn: !draws(own),
            notInOther: !draws(other),
        }
        variants.push(variant)
        if (!variant.standIn) continue

        // in the bar: the other print's figures, ornaments or directions, grey
        if (app.parentElement?.localName === 'measure') {
            standIns.push(() => {
                const copies = Array.from(other.children).map(child => {
                    const copy = child.cloneNode(true) as Element
                    for (const el of [copy, ...elementsOf(copy)]) {
                        const id = idOf(el)
                        if (id) el.setAttributeNS(XML_NS, 'xml:id', `${id}-stand-in`)
                    }
                    return copy
                })
                own.append(...copies)
                variant.ids = copies.flatMap(copy => [copy, ...elementsOf(copy)]).map(el => idOf(el)!).filter(Boolean)
            })
            continue
        }

        // in a layer: a mark above the staff, where this print has nothing (at the note
        // whose accidental it lacks, or at the space it has, or next to it)
        const start = app.parentElement?.closest(TIMED.join(', '))
            ?? timedIn(elementsOf(own).find(el => TIMED.includes(el.localName)))
            ?? timedIn(app.nextElementSibling)
            ?? timedIn(app.previousElementSibling)
        const staff = app.closest('staff')?.getAttribute('n')
        if (!start || !staff) {
            variant.ids = []
            continue
        }
        const startId = withId(start, `${name}-start`)
        standIns.push(() => {
            const mark = document.createElementNS(MEI_NS, 'dir')
            mark.setAttributeNS(XML_NS, 'xml:id', `${name}-mark`)
            mark.setAttribute('staff', staff)
            mark.setAttribute('startid', `#${startId}`)
            mark.setAttribute('place', 'above')
            mark.textContent = '*'
            measure.append(mark)
            variant.ids = [`${name}-mark`]
        })
    }

    return {
        variants,
        addStandIns: () => standIns.forEach(add => add()),
    }
}

/** IDs of all elements of drawn stand-ins, to draw them grey */
export const standInIds = (variants: Variant[]) => variants.filter(variant => variant.standIn).flatMap(variant => variant.ids)

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Puts a box behind the elements with the given IDs in a drawing by Verovio, for each
 * group that has any of them on the page, and returns the boxes. The SVG must be laid
 * out in the document.
 */
export const boxBehind = (svg: Element, groups: { ids: string[]; className: string; data?: Record<string, string> }[]) => {
    const page = svg.querySelector<SVGGElement>('g.page-margin')
    const toPage = page?.getScreenCTM()?.inverse()
    if (!page || !toPage) return []

    const boxes: SVGRectElement[] = []
    for (const group of groups) {
        const rects = group.ids
            .map(id => svg.querySelector(`[id="${id}"]`))
            .filter((el): el is Element => !!el)
            .map(el => el.getBoundingClientRect())
            .filter(rect => rect.width > 0 || rect.height > 0)
        if (rects.length === 0) continue

        // from the screen to the page of the drawing
        const corner = (x: number, y: number) => new DOMPoint(x, y).matrixTransform(toPage)
        const topLeft = corner(Math.min(...rects.map(r => r.left)), Math.min(...rects.map(r => r.top)))
        const bottomRight = corner(Math.max(...rects.map(r => r.right)), Math.max(...rects.map(r => r.bottom)))
        // a little room around the elements, a fifth of a staff space or so
        const pad = 60

        const box = svg.ownerDocument.createElementNS(SVG_NS, 'rect')
        box.setAttribute('x', String(topLeft.x - pad))
        box.setAttribute('y', String(topLeft.y - pad))
        box.setAttribute('width', String(bottomRight.x - topLeft.x + 2 * pad))
        box.setAttribute('height', String(bottomRight.y - topLeft.y + 2 * pad))
        box.setAttribute('rx', String(pad))
        box.setAttribute('class', group.className)
        // Verovio's style for the drawing gives every rect a stroke
        box.style.stroke = 'none'
        for (const [key, value] of Object.entries(group.data || {})) box.setAttribute(`data-${key}`, value)
        // behind everything else on the page
        page.insertBefore(box, page.firstChild)
        boxes.push(box)
    }
    return boxes
}
