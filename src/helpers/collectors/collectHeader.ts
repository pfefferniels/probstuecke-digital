import type { TextHeader } from '@/lib/types'

const text = (el: Element | null | undefined) =>
    el?.textContent?.replace(/\s+/g, ' ').trim() || null

const personName = (persName: Element) => {
    const forename = text(persName.querySelector('forename'))
    const surname = text(persName.querySelector('surname'))
    if (forename || surname) return [forename, surname].filter(Boolean).join(' ')
    return text(persName) || ''
}

export const collectHeader = (document: Document): TextHeader => {
    const fileDesc = document.querySelector('teiHeader fileDesc')

    const editors = Array
        .from(fileDesc?.querySelectorAll('titleStmt > editor') || [])
        .map(editor => {
            const persName = editor.querySelector('persName')
            return {
                name: persName ? personName(persName) : text(editor) || '',
                role: editor.getAttribute('role')
            }
        })
        .filter(editor => editor.name !== '')

    const msIdentifier = fileDesc?.querySelector('sourceDesc msIdentifier')
    const idno = (type: string) => text(msIdentifier?.querySelector(`idno[type="${type}"]`))
    const copy = msIdentifier
        ? {
            shelfmark: idno('shelfmark'),
            catalogue: idno('URLCatalogue'),
            iiif: idno('URLIIIF'),
            urn: idno('URN'),
        }
        : null

    const licence = fileDesc?.querySelector('publicationStmt availability licence')

    return {
        title: text(fileDesc?.querySelector('titleStmt > title')),
        editors,
        source: text(fileDesc?.querySelector('sourceDesc > bibl[type="M"]')),
        copy,
        licence: licence
            ? { url: licence.getAttribute('target'), label: text(licence) }
            : null,
    }
}
