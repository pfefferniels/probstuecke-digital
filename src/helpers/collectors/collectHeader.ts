import type { Participant, TextHeader } from '@/lib/types'

const text = (el: Element | null | undefined) =>
    el?.textContent?.replace(/\s+/g, ' ').trim() || null

const personName = (persName: Element) => {
    const forename = text(persName.querySelector('forename'))
    const surname = text(persName.querySelector('surname'))
    if (forename || surname) return [forename, surname].filter(Boolean).join(' ')
    return text(persName) || ''
}

// The participants of a lesson, with the IDs that @who points to. They belong in
// particDesc; older encodings named them there without IDs and gave the IDs in a
// listPerson in the body, so the same person may be found twice.
const collectParticipants = (document: Document): Participant[] => {
    const participants: Participant[] = []
    for (const person of Array.from(document.querySelectorAll('particDesc person, text listPerson person'))) {
        const persName = person.querySelector('persName')
        const name = persName ? personName(persName) : text(person) || ''
        if (name === '') continue
        const xmlId = person.getAttribute('xml:id')
        const role = person.getAttribute('role')
        const known = participants.find(p => (xmlId && p.xmlId === xmlId) || p.name === name)
        if (known) {
            known.xmlId ??= xmlId
            known.role ??= role
        }
        else {
            participants.push({ xmlId, name, role })
        }
    }
    return participants
}

// "17 May 2019, Hochschule für Musik, Freiburg im Breisgau, Germany"
const collectSetting = (document: Document) => {
    const setting = document.querySelector('profileDesc settingDesc setting')
    if (!setting) return null
    const parts = Array.from(setting.children).map(child => text(child)).filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
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
        participants: collectParticipants(document),
        setting: collectSetting(document),
    }
}
