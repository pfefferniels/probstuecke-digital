export const collectRefTargets = (document: Document): (string | null)[] => {
    return Array
        .from(document.querySelectorAll('ref[target]'))
        .map(el => el.getAttribute('target'))
}
