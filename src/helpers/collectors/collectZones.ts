// the page image (…/iiif/image/v2/<id>_<canvas>/full/…) or, in older encodings, the IIIF canvas
const IMAGE_URL = /\/iiif\/image\/v2\/([^/_]+)_(\d+)\//
const CANVAS_URL = /\/([^/]+)\/canvas\/(\d+)/

export const collectZones = (document: Document) => {
    return Array
        .from(document.querySelectorAll('zone'))
        .map(zone => {
            const xmlId = zone.getAttribute('xml:id')
            const ulx = zone.getAttribute('ulx')
            const uly = zone.getAttribute('uly')
            const lrx = zone.getAttribute('lrx')
            const lry = zone.getAttribute('lry')

            const url = zone.parentElement?.querySelector('graphic')?.getAttribute('target')
            if (!url) return null

            const match = url.match(IMAGE_URL) || url.match(CANVAS_URL)
            if (!match) return null

            const identifier = match[1]
            const scanId = parseInt(match[2]).toString().padStart(5, '0')

            const imageApiUrl = `https://api.digitale-sammlungen.de/iiif/image/v2/${identifier}_${scanId}/${ulx},${uly},${parseInt(lrx!) - parseInt(ulx!)},${parseInt(lry!) - parseInt(uly!)}/pct:50/0/color.jpg`

            return {
                xmlId,
                imageApiUrl
            }
        })
        .filter(zone => zone !== null)
}
