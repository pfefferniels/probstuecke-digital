import * as fs from 'fs'
import * as path from 'path'

interface EmbeddedMEI {
    mei: string
    xmlId: string
}

export const collectEmbeddedMEI = (document: Document, absolutePath: string): EmbeddedMEI[] => {
    const notatedMusicEls = Array.from(document.querySelectorAll('notatedMusic'))
    const mei: EmbeddedMEI[] = []

    for (const music of notatedMusicEls) {
        const xmlId = music.getAttribute('xml:id')
        if (!xmlId) continue
        const ptr = music.querySelector('ptr')
        if (!ptr) continue
        const target = ptr.getAttribute('target')
        if (!target) continue

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
