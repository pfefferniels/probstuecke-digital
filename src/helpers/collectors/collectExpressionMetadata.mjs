/**
 * Extracts relevant metadata from a TEI encoding.
 * 
 * @param {Document} document TEI document to extract from
 * @returns 
 */
export const collectExpressionMetadata = (document) => {
  const tei = document.querySelector('TEI');
  const expressionId = tei && tei.getAttribute('xml:id');
  const isFraktur = document.querySelector('typeDesc')?.textContent.trim() === 'Fraktur';
  const label = tei.querySelector('title')?.textContent;

  return {
    expressionId,
    isFraktur,
    label
  };
};
