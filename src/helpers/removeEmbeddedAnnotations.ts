export const removeEmbeddedAnnotations = (meiDoc: Document) => {
    meiDoc.querySelector('staffDef[type="embeddedAnnotation"]')?.remove()
    meiDoc.querySelectorAll('measure').forEach(measure => {
        const child = measure.querySelector('staff[n="1"]')
        if (child) measure.removeChild(child)
    })
}
