/**
 * Returns the targets of all <ref> elements
 * 
 * @param {Document} document TEI document to extract from
 * @returns 
 */
export const collectZones = (document) => {
    console.log(document.querySelectorAll('zone').length)
    return Array
        .from(document.querySelectorAll('zone'))
        .map(zone => {
            const xmlId = zone.getAttribute('xml:id')
            const ulx = zone.getAttribute('ulx')
            const uly = zone.getAttribute('uly')
            const lrx = zone.getAttribute('lrx')
            const lry = zone.getAttribute('lry')

            const url = zone.parentElement.querySelector('graphic')?.getAttribute('target')
            if (!url) {
                console.log('No image URL found for zone', xmlId)
                return null
            }

            const canvasUrl = zone.parentElement.querySelector('graphic')?.getAttribute('target');
            const match = canvasUrl.match(/\/([^\/]+)\/canvas\/(\d+)/);
            if (!match) {
                console.log('Invalid canvas URL format', canvasUrl);
                return null;
            }
            const identifier = match[1];
            const scanId = (parseInt(match[2]) - 16).toString().padStart(5, '0');

            const imageApiUrl = `https://api.digitale-sammlungen.de/iiif/image/v2/${identifier}_${scanId}/${ulx},${uly},${lrx-ulx},${lry-uly}/pct:50/0/color.jpg`;

            return {
                xmlId,
                imageApiUrl
            }
        })
        .filter(zone => zone !== null)

}
