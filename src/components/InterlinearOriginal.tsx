'use client'

import { useEffect, useState, type RefObject } from 'react'

/** A line of the original, beneath a line of the translation */
interface Line {
  pair: number
  left: number
  top: number
  size: number
  lang: string
  text: string
}

interface InterlinearOriginalProps {
  /** the element holding the text of the translation (position: relative) */
  container: RefObject<HTMLElement | null>
}

// size of the original, relative to the translation
const SCALE = 0.65
// distance of the original from the line of the translation above it, in px
const DROP = 1
// space between two sentences, and around notes and music examples, in px
const GAP = 6

const PAIRS = 'tei-seg[type="pair"]'

const partOf = (pair: Element, type: string) => pair.querySelector<HTMLElement>(`:scope > tei-seg[type="${type}"]`)

// at the end of the translation
const spacerOf = (pair: Element) => partOf(partOf(pair, 'translation')!, 'space')

// the rendered text of the original (modern spelling), without the editors' notes and catchwords
const textOf = (original: Element) => {
  const clone = original.cloneNode(true) as Element
  clone.querySelectorAll('tei-note, tei-fw').forEach((el) => el.remove())
  return (clone.textContent || '').replace(/\s+/g, ' ').trim()
}

// the boxes of the words of a translated sentence, line by line (notes left out)
const textRects = (translation: Element) => {
  const rects: DOMRect[] = []
  const walker = document.createTreeWalker(translation, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent || ''
    const start = text.search(/\S/)
    if (start < 0 || node.parentElement?.closest('tei-note')) continue
    range.setStart(node, start)
    range.setEnd(node, text.trimEnd().length)
    rects.push(...Array.from(range.getClientRects()).filter((rect) => rect.width > 0))
  }
  return rects
}

interface Row { top: number; bottom: number }

// the lines of the translation in a paragraph, top to bottom; where a music example,
// a note or a spacer leaves a gap, lines at the usual distance are filled in
const rowsOf = (pairs: Element[], pitch: number) => {
  const rows: Row[] = []
  const rects = pairs.flatMap((pair) => textRects(partOf(pair, 'translation')!)).sort((a, b) => a.top - b.top)
  for (const rect of rects) {
    const row = rows[rows.length - 1]
    if (row && rect.top < row.bottom - 2) row.bottom = Math.max(row.bottom, rect.bottom)
    else rows.push({ top: rect.top, bottom: rect.bottom })
  }
  return rows.flatMap((row, i) => {
    const next = rows[i + 1]
    const filled = [row]
    for (let k = 1; next && row.top + k * pitch < next.top - pitch / 2; k++) {
      filled.push({ top: row.top + k * pitch, bottom: row.bottom + k * pitch })
    }
    return filled
  })
}

// the distance between the lines of a paragraph
const pitchOf = (pairs: Element[], style: CSSStyleDeclaration) => {
  const tops = pairs.flatMap((pair) => textRects(partOf(pair, 'translation')!)).map((rect) => rect.top).sort((a, b) => a - b)
  const fontSize = parseFloat(style.fontSize)
  const steps = tops.slice(1).map((top, i) => top - tops[i]).filter((step) => step > fontSize)
  return steps.length > 0 ? Math.min(...steps) : parseFloat(style.lineHeight) || fontSize * 2.6
}

/**
 * Sets the sentences of the original into the space beneath the lines of their
 * translation, paragraph by paragraph. With `adjust`, the spacer at the end of a
 * translation (<seg type="space">) is first widened where its original needs more
 * room, so that the next sentence starts after it; otherwise the spacers are left
 * as they are and only the original is placed.
 */
const layout = (root: HTMLElement, adjust: boolean): Line[] => {
  const pairs = Array.from(root.querySelectorAll<HTMLElement>(PAIRS))
  if (adjust) pairs.forEach((pair) => spacerOf(pair)?.removeAttribute('style'))

  const origin = root.getBoundingClientRect()
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return []
  const lines: Line[] = []

  const paragraphs = new Map<Element, HTMLElement[]>()
  for (const pair of pairs) {
    // a sentence may stand in a quotation or a reference inside the paragraph
    const paragraph = pair.closest('tei-p') ?? pair.parentElement!
    paragraphs.set(paragraph, [...(paragraphs.get(paragraph) || []), pair])
  }
  // notes and music examples anywhere in the text: a note beside one paragraph may reach into the next
  const blocks = Array.from(root.querySelectorAll('tei-note, tei-notatedmusic, tei-figure'))
    .filter((el) => !el.closest('tei-seg[type="original"]'))

  for (const [paragraph, group] of paragraphs) {
    const style = getComputedStyle(paragraph)
    const fontSize = parseFloat(style.fontSize)
    const size = fontSize * SCALE
    context.font = `${size}px Junicode, serif`
    const space = context.measureText(' ').width
    const box = paragraph.getBoundingClientRect()
    const contentLeft = box.left + parseFloat(style.paddingLeft)
    const contentRight = box.right - parseFloat(style.paddingRight)
    const center = (contentLeft + contentRight) / 2
    const band = size * 1.2
    const pitch = pitchOf(group, style)

    let previous: { top: number; x: number } | null = null
    for (const pair of group) {
      const original = partOf(pair, 'original')
      const words = original ? textOf(original).split(' ').filter(Boolean) : []
      const first = textRects(partOf(pair, 'translation')!)[0]
      if (!first || words.length === 0) continue

      // measured again for each sentence: the spacers of the sentences before may have moved them
      const rows = rowsOf(group, pitch)
      const obstacles = blocks.map((el) => el.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0)
      const last = rows[rows.length - 1]
      // beyond the last line of the paragraph, lines are added at the same distance
      const rowAt = (i: number) => (i < rows.length
        ? rows[i]
        : { top: last.top + (i - rows.length + 1) * pitch, bottom: last.bottom + (i - rows.length + 1) * pitch })
      const rowOf = (top: number) => {
        const i = rows.findIndex((row) => Math.abs(row.top - top) < pitch / 2)
        return i >= 0 ? i : rows.length - 1 + Math.max(1, Math.round((top - last.top) / pitch))
      }
      // the space beneath a line, or null if a note or a music example fills it
      const slot = (i: number) => {
        const top = rowAt(i).bottom + DROP
        let left = contentLeft
        let right = contentRight
        for (const rect of obstacles) {
          if (rect.top >= top + band || rect.bottom <= top) continue
          if (rect.left >= center) right = Math.min(right, rect.left - GAP)
          else if (rect.right <= center) left = Math.max(left, rect.right + GAP)
          else return null
        }
        return right - left > fontSize * 2 ? { top, left, right } : null
      }

      // the original begins beneath the beginning of its translation, unless the previous sentence is still running
      let row = rowOf(first.top)
      let x = first.left
      if (previous) {
        const previousRow = rowOf(previous.top)
        if (previousRow > row || (previousRow === row && previous.x + GAP > x)) {
          row = previousRow
          x = previous.x + GAP
        }
      }

      let line: Line | null = null
      for (const word of words) {
        const width = context.measureText(word).width
        for (let tries = 0; tries < 200; tries++) {
          const s = slot(row)
          if (s) {
            x = Math.max(x, s.left)
            const fresh = !line || line.top !== s.top - origin.top
            // a word longer than the line still has to go somewhere
            if (x + width <= s.right || (fresh && x === s.left) || tries > 50) {
              if (fresh) {
                line = { pair: pairs.indexOf(pair), left: x - origin.left, top: s.top - origin.top, size, lang: original!.lang, text: word }
                lines.push(line)
              } else {
                line!.text += ` ${word}`
              }
              x += width + space
              break
            }
          }
          row++
          x = -Infinity
        }
      }
      const end = { top: rowAt(row).top, x: x - space }

      // make room for the rest of the original before the next sentence
      const spacer = spacerOf(pair)
      if (adjust && spacer) {
        spacer.setAttribute('style', 'display: inline-block; width: 0')
        const at = spacer.getBoundingClientRect()
        spacer.removeAttribute('style')
        // the spacer has no height: it stands on the baseline of its line
        const inRow = rows.findIndex((r) => at.top >= r.top - 2 && at.top <= r.bottom + 2)
        const spacerRow = inRow >= 0 ? inRow : rowOf(at.top)
        // the room on a line, as far as a note beside the text leaves it: a wider
        // spacer would drop below the note and take the following lines with it
        const room = (i: number) => slot(i) ?? { left: contentLeft, right: contentRight }
        const needed = end.x + GAP
        if (row === spacerRow && needed > at.left) {
          const width = Math.min(needed, room(row).right - 1) - at.left
          spacer.setAttribute('style', `display: inline-block; width: ${Math.floor(width)}px`)
        }
        // into the next line: wider than what is left of this one, so that it wraps
        else if (row === spacerRow + 1) {
          const width = Math.min(
            Math.max(needed - room(row).left, room(spacerRow).right - at.left + 1),
            room(row).right - room(row).left - 1
          )
          spacer.setAttribute('style', `display: inline-block; width: ${Math.floor(width)}px`)
        }
        // further: as many empty lines as the original needs; the next sentence starts on a new line
        else if (row > spacerRow + 1) {
          spacer.setAttribute('style', `display: block; height: ${Math.ceil((row - spacerRow) * pitch + DROP + band)}px`)
        }
        // otherwise not shown: at the start of a line it would keep the space after it
      }
      previous = end
    }
  }
  return lines
}

/**
 * The original of an aligned translation between its lines: beneath each sentence
 * of the translation, small and grey, the sentence of the original that it renders
 * (<seg type="pair">, see helpers/alignTranslation). The translation keeps its flow.
 * Pointing at a sentence or at its original highlights both.
 */
export const InterlinearOriginal = ({ container }: InterlinearOriginalProps) => {
  const [lines, setLines] = useState<Line[]>([])
  const [active, setActive] = useState(-1)

  // laid out again whenever the text changes its size: when it is first rendered,
  // when the music examples are drawn, when the window is resized, when the fonts arrive
  useEffect(() => {
    const root = container.current
    if (!root) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      // first the spacers, then the original in the layout they leave
      frame = requestAnimationFrame(() => {
        layout(root, true)
        setLines(layout(root, false))
      })
    }
    const observer = new ResizeObserver(update)
    observer.observe(root)
    document.fonts?.ready.then(update)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      root.querySelectorAll('tei-seg[type="space"]').forEach((spacer) => spacer.removeAttribute('style'))
    }
  }, [container])

  useEffect(() => {
    const root = container.current
    if (!root) return
    const highlight = (index: number) => {
      root.querySelectorAll(PAIRS).forEach((pair, i) => pair.classList.toggle('active', i === index))
      setActive(index)
    }
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as Element
      const line = target.closest('[data-pair]')
      const pair = target.closest(PAIRS)
      highlight(line
        ? Number(line.getAttribute('data-pair'))
        : pair ? Array.from(root.querySelectorAll(PAIRS)).indexOf(pair) : -1)
    }
    const onPointerLeave = () => highlight(-1)
    root.addEventListener('pointerover', onPointerOver)
    root.addEventListener('pointerleave', onPointerLeave)
    return () => {
      root.removeEventListener('pointerover', onPointerOver)
      root.removeEventListener('pointerleave', onPointerLeave)
      highlight(-1)
    }
  }, [container])

  return (
    <div className="interlinearOriginal" aria-hidden="true">
      {lines.map((line, i) => (
        <span
          key={i}
          data-pair={line.pair}
          lang={line.lang || undefined}
          className={line.pair === active ? 'active' : undefined}
          style={{ left: line.left, top: line.top, fontSize: line.size }}
        >
          {line.text}
        </span>
      ))}
    </div>
  )
}
