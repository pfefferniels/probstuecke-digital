/**
 * Returns the targets of all <ref> elements
 * 
 * @param {Document} document TEI document to extract from
 * @returns 
 */
export const collectRefTargets = (document) => {
    return Array
        .from(document.querySelectorAll('ref[target]'))
        .map(el => el.getAttribute('target'))
}
