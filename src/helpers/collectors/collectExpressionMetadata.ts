export const collectExpressionMetadata = (document: Document) => {
  const tei = document.querySelector('TEI')
  const expressionId = tei?.getAttribute('xml:id') ?? null
  const isFraktur = document.querySelector('typeDesc')?.textContent?.trim() === 'Fraktur'
  const label = tei?.querySelector('title')?.textContent ?? null

  return {
    expressionId,
    isFraktur,
    label
  }
}
