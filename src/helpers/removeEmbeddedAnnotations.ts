// In each score (one per <mdiv>), the first staff marked as an embedded annotation
// holds what Mattheson wrote into the music for the right hand. It is removed with
// its definition.
export const removeEmbeddedAnnotations = (meiDoc: Document) => {
    meiDoc.querySelectorAll('score').forEach(score => {
        const staffDef = score.querySelector('staffDef[type="embeddedAnnotation"]')
        if (!staffDef) return
        const n = staffDef.getAttribute('n')
        staffDef.remove()
        score.querySelectorAll('measure').forEach(measure => {
            measure.querySelector(`staff[n="${n}"]`)?.remove()
        })
    })
}
