import * as fs from 'fs'
import * as path from 'path'

interface EmbeddedMEI {
    mei: string
    xmlId: string
}

/**
 * The MEI files a text shows: the score and the music examples (notatedMusic/ptr),
 * and in lessons the transcriptions of what is played (ptr[@type="transcription"]).
 * Each is identified by the xml:id of its element or else by the file name, as in
 * NotatedMusic.
 */
export const collectEmbeddedMEI = (document: Document, absolutePath: string): EmbeddedMEI[] => {
    const musicEls = Array.from(document.querySelectorAll('notatedMusic, ptr[type="transcription"]'))
    const mei: EmbeddedMEI[] = []

    for (const music of musicEls) {
        const ptr = music.localName === 'ptr' ? music : music.querySelector('ptr')
        if (!ptr) continue
        const target = ptr.getAttribute('target')
        if (!target) continue
        const xmlId = music.getAttribute('xml:id') || target.replace('.xml', '')

        try {
            const meiContents = fs.readFileSync(`${path.dirname(absolutePath)}/${target}`, 'utf-8')
            mei.push({
                mei: meiContents,
                xmlId
            })
        }
        catch {
            // MEI file not found, skip
        }
    }

    return mei
}
