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

// the lines of the translation in a paragraph, top to bottom
const rowsOf = (pairs: Element[]) => {
  const rows: { top: number; bottom: number }[] = []
  const rects = pairs.flatMap((pair) => textRects(partOf(pair, 'translation')!)).sort((a, b) => a.top - b.top)
  for (const rect of rects) {
    const row = rows[rows.length - 1]
    if (row && rect.top < row.bottom - 2) row.bottom = Math.max(row.bottom, rect.bottom)
    else rows.push({ top: rect.top, bottom: rect.bottom })
  }
  return rows
}

/**
 * Sets the sentences of the original into the space beneath the lines of their
 * translation, paragraph by paragraph. Where a sentence of the original needs more
 * room than its translation, the spacer at the end of the translation
 * (<seg type="space">) is widened, so that the next sentence starts after it.
 */
const layout = (root: HTMLElement): Line[] => {
  const pairs = Array.from(root.querySelectorAll<HTMLElement>(PAIRS))
  pairs.forEach((pair) => spacerOf(pair)?.removeAttribute('style'))

  const origin = root.getBoundingClientRect()
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return []
  const lines: Line[] = []

  const paragraphs = new Map<Element, HTMLElement[]>()
  for (const pair of pairs) {
    const paragraph = pair.parentElement!
    paragraphs.set(paragraph, [...(paragraphs.get(paragraph) || []), pair])
  }

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
    // notes beside the text and music examples below it
    const blocks = Array.from(paragraph.querySelectorAll('tei-note, tei-notatedmusic, tei-figure'))
      .filter((el) => !el.closest('tei-seg[type="original"]'))

    let previous: { top: number; x: number } | null = null
    for (const pair of group) {
      const original = partOf(pair, 'original')
      const words = original ? textOf(original).split(' ').filter(Boolean) : []
      const first = textRects(partOf(pair, 'translation')!)[0]
      if (!first || words.length === 0) continue

      // measured again for each sentence: the spacers of the sentences before may have moved them
      const rows = rowsOf(group)
      const obstacles = blocks.map((el) => el.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0)
      const last = rows[rows.length - 1]
      const pitch = rows.length > 1 ? (last.top - rows[0].top) / (rows.length - 1) : parseFloat(style.lineHeight) || fontSize * 2
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
      if (spacer) {
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
        let width = 0
        if (row === spacerRow) width = Math.min(needed, room(row).right - 1) - at.left
        // into the next line: wider than what is left of this one, so that it wraps
        else if (row === spacerRow + 1) {
          width = Math.min(
            Math.max(needed - room(row).left, room(spacerRow).right - at.left + 1),
            room(row).right - room(row).left - 1
          )
        }
        // further: a whole line; the original then runs on beneath the next sentence
        else if (row > spacerRow + 1) width = room(spacerRow + 1).right - room(spacerRow + 1).left - 1
        // shown only when needed: at the start of a line it would keep the space after it
        if (width > 0) spacer.setAttribute('style', `display: inline-block; width: ${Math.floor(width)}px`)
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
      frame = requestAnimationFrame(() => setLines(layout(root)))
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
