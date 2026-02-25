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

            const canvasUrl = zone.parentElement?.querySelector('graphic')?.getAttribute('target')
            if (!canvasUrl) return null
            const match = canvasUrl.match(/\/([^/]+)\/canvas\/(\d+)/)
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
