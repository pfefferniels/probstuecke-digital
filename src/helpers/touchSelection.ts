/**
 * Touch screens have no hover. There, a tap on a passage of the commentary or on
 * a referenced element of the score selects the link between the two: both are
 * highlighted and the other side is brought into view. One link is selected at
 * a time; a tap anywhere else clears it.
 */

let lastPointerType = 'mouse'
let clearSelection: (() => void) | null = null

if (typeof window !== 'undefined') {
    // Browsers follow a tap with emulated mouse events and a click; this tells them apart
    const track = (e: PointerEvent) => { lastPointerType = e.pointerType }
    window.addEventListener('pointerdown', track, { capture: true, passive: true })
    window.addEventListener('pointermove', track, { capture: true, passive: true })

    // a tap ends with pointerup (a swipe with pointercancel); unlike click, iOS fires it on plain text too
    document.addEventListener('pointerup', e => {
        if (e.pointerType === 'mouse') return
        if ((e.target as Element | null)?.closest('.ref, .score')) return
        clearTouchSelection()
    })
}

/** Whether the current click comes from a finger or a pen rather than a mouse */
export const isTouchInput = () => lastPointerType !== 'mouse'

/** Scrolls the element to the middle of the screen, unless it is fully visible already */
export const revealElement = (el: Element) => {
    const rect = el.getBoundingClientRect()
    // on wide screens the bar with the title of the piece stays at the top and covers what is below it
    const bar = document.querySelector('.piece .title')
    const top = bar && getComputedStyle(bar).position === 'sticky'
        ? Math.max(0, bar.getBoundingClientRect().bottom)
        : 0
    if (rect.top >= top && rect.bottom <= window.innerHeight) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

export const clearTouchSelection = () => {
    clearSelection?.()
    clearSelection = null
}

/**
 * Highlights the passages and the score elements with the given IDs, and brings
 * the score elements (`reveal: 'score'`) or the first passage (`reveal: 'text'`) into view.
 */
export const selectLink = (passages: Element[], meiIds: string[], reveal: 'score' | 'text') => {
    clearTouchSelection()
    // pages without music (e.g. lessons) have nothing to link to
    if (!document.querySelector('.score svg')) return

    passages.forEach(passage => passage.classList.add('highlight'))
    const dehighlight = window.highlightRefs(meiIds, reveal === 'score')
    if (reveal === 'text' && passages.length > 0) revealElement(passages[0])

    clearSelection = () => {
        passages.forEach(passage => passage.classList.remove('highlight'))
        dehighlight()
    }
}
