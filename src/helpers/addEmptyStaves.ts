export const addEmptyStaves = (meiDoc: Document, emptyStaves: number) => {
    for (let i = 0; i < emptyStaves; i++) {
        meiDoc.querySelectorAll('measure').forEach(measure => {
            const layer = meiDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'layer')
            layer.setAttribute('n', '1')
            const newStaff = meiDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'staff')
            newStaff.setAttribute('n', `${i + 3}`)
            newStaff.appendChild(layer)
            measure.insertBefore(newStaff, measure.querySelector('staff')!)
        })
        const staffGrp = meiDoc.querySelector('staffGrp')
        if (!staffGrp) continue
        const staffDef = meiDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'staffDef')
        staffDef.setAttribute('n', `${i + 3}`)
        staffDef.setAttribute('lines', '5')
        staffGrp.insertBefore(staffDef, staffGrp.querySelector('staffDef'))
    }
}
