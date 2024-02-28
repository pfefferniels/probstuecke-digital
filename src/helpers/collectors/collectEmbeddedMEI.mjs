import * as fs from 'fs'
import * as path from 'path'

/**
 * Finds <ptr> inside all <notatedMusic> elements of 
 * a TEI encoding and returns the content of the
 * referenced MEI files.
 * 
 * @param {Document} document TEI encoding to extract from
 * @param {string} absolutePath path to look into
 * @returns {string[]}
 */
export const collectEmbeddedMEI = (document, absolutePath) => {
    const notatedMusicEls = Array.from(document.querySelectorAll('notatedMusic'))
    let mei = []

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
        catch (e) {
            console.log('MEI file', target, 'not found in', path.dirname(absolutePath), 'Ignoring.')
        }
    }

    return mei
}
