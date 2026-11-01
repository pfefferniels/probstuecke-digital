import type { WorkExpression, WorkKey } from '@/lib/types'

/** Short label used in lists of versions, e.g. "1719", "English", "Hill" or "Dijoux (English)" */
export const shortLabel = (expression: WorkExpression) => {
  if (expression.type === 'edition') return expression.date
  if (expression.author === '') return expression.lang
  // a translation of a text by another author than Mattheson, e.g. Dijoux's notes on his realisation
  // (with a no-break space, so that the label does not break in the overview)
  return expression.type === 'translation' ? `${expression.author}\u00a0(${expression.lang})` : expression.author
}

/** Label naming a version of a text, e.g. "Edition 1719", "English translation" or "Lesson by Hill" */
export const longLabel = (expression: WorkExpression) => {
  if (expression.type === 'edition') return `Edition ${expression.date}`
  if (expression.type === 'translation') {
    return expression.author !== ''
      ? `${expression.lang} translation of ${expression.author}`
      : `${expression.lang} translation`
  }
  if (expression.type === 'realisation') return `Realisation by ${expression.author}`
  if (expression.type === 'lesson') return `Lesson by ${expression.author}`
  return shortLabel(expression)
}

/** Label of a version among the others of its piece, e.g. "1719", "English" or "Lesson by Hill" */
export const versionLabel = (expression: WorkExpression) =>
  expression.type === 'edition' || expression.type === 'translation'
    ? shortLabel(expression)
    : longLabel(expression)

/** Key of a work, e.g. "E♭ major" */
export const keyLabel = (key: WorkKey) =>
  `${key.pname?.toUpperCase() ?? ''}${key.accid === 'f' ? '♭' : key.accid === 's' ? '♯' : ''} ${key.mode ?? ''}`.trim()
