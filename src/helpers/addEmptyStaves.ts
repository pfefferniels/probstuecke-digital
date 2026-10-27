const MEI_NS = 'http://www.music-encoding.org/ns/mei'

export const addEmptyStaves = (meiDoc: Document, emptyStaves: number) => {
    for (let i = 0; i < emptyStaves; i++) {
        meiDoc.querySelectorAll('measure').forEach(measure => {
            const layer = meiDoc.createElementNS(MEI_NS, 'layer')
            layer.setAttribute('n', '1')
            const newStaff = meiDoc.createElementNS(MEI_NS, 'staff')
            newStaff.setAttribute('n', `${i + 3}`)
            newStaff.appendChild(layer)
            measure.insertBefore(newStaff, measure.querySelector(':scope > staff'))
        })
        // every score (one per <mdiv>) defines its staves
        meiDoc.querySelectorAll('scoreDef > staffGrp').forEach(staffGrp => {
            const staffDef = meiDoc.createElementNS(MEI_NS, 'staffDef')
            staffDef.setAttribute('n', `${i + 3}`)
            staffDef.setAttribute('lines', '5')
            const firstStaff = Array
                .from(staffGrp.children)
                .find(child => child.localName === 'staffDef' || child.localName === 'staffGrp')
            staffGrp.insertBefore(staffDef, firstStaff || null)
        })
    }
}
