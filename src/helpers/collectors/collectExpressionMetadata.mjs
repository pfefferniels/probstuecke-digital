/**
 * Extracts relevant metadata from a TEI encoding.
 * 
 * @param {Document} document TEI document to extract from
 * @returns 
 */
export const collectExpressionMetadata = (document) => {
  const tei = document.querySelector('TEI');
  const expressionId = tei && tei.getAttribute('xml:id');

  const derivation = document.querySelector('derivation');
  const derivationType = derivation
    ? derivation.getAttribute('type')
    : null;

  const relation = Array
    .from(document.querySelectorAll('relation'))
    .find(relation => relation.getAttribute('name') === 'realises');
  const realises = relation && relation.getAttribute('passive');


  let label = '[unknown]';
  if (derivationType === 'translation') {
    const language = document.querySelector('language');
    label = language
      ? language.textContent
      : label;
  }
  else if (derivationType === 'edition') {
    const biblFull = document.querySelector('biblFull');
    const date = biblFull && biblFull.querySelector('date');
    label = date && date.textContent || label;
  }

  return {
    expressionId,
    derivationType,
    label,
    realises
  };
};
