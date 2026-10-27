import * as fs from 'fs'
import * as path from 'path'
import type { ExpressionMedia } from '@/lib/types'

const MIME_TYPES: Record<string, string> = {
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.opus': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
}

const normalise = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim() || ''

/**
 * What a recording in a lesson is of: who does what, from the action whose
 * description points to it (e.g. "Robert Hill spielt Takt 1"); a <desc> in <media>
 */
const describe = (el: Element) => {
    if (el.localName === 'media') return normalise(el.querySelector('desc')?.textContent) || null

    const desc = el.closest('desc')
    const action = desc?.parentElement
    if (!desc || !action) return null
    const clone = desc.cloneNode(true) as Element
    // the editorial notes are not part of the description
    clone.querySelectorAll('note').forEach(note => note.remove())
    const description = normalise(clone.textContent)

    const who = action.getAttribute('who')?.split(/\s+/)[0]?.replace(/^#/, '')
    const person = who
        ? Array.from(el.ownerDocument.querySelectorAll('person')).find(p => p.getAttribute('xml:id') === who)
        : null
    const name = normalise(person?.querySelector('persName')?.textContent)
    return [name, description].filter(Boolean).join(' ') || null
}

/**
 * The audio recordings a text points to: ptr[@type="audio"] (what is played in a
 * lesson) and media (the recording of a realisation). Relative paths are resolved
 * against the TEI file; scripts/copy-data.mjs copies the files to /data/.
 *
 * @param absolutePath the TEI file
 * @param dataDir the directory that is served under /data/
 */
export const collectMedia = (document: Document, absolutePath: string, dataDir: string): ExpressionMedia[] => {
    const pointers = Array
        .from(document.querySelectorAll('ptr[type="audio"], media'))
        .map(el => ({
            target: el.getAttribute(el.localName === 'media' ? 'url' : 'target'),
            mimeType: el.getAttribute('mimeType'),
            label: describe(el),
        }))

    const media: ExpressionMedia[] = []
    for (const { target, mimeType, label } of pointers) {
        if (!target || media.some(m => m.target === target)) continue
        if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
            media.push({ target, url: target, mimeType, bytes: null, label })
            continue
        }

        const file = path.resolve(path.dirname(absolutePath), target)
        let bytes: number | null = null
        try {
            bytes = fs.statSync(file).size
        }
        catch {
            // not in the data: the player says that it cannot play it
        }
        const served = path.relative(dataDir, file).split(path.sep).join('/')
        media.push({
            target,
            url: `/data/${served}`,
            mimeType: mimeType || MIME_TYPES[path.extname(file).toLowerCase()] || null,
            bytes,
            label,
        })
    }
    return media
}
