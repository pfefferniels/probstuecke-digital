import type { WorkExpression, WorkKey } from '@/lib/types'

/** Short label used in lists of versions, e.g. "1719", "English" or "Hill" */
export const shortLabel = (expression: WorkExpression) =>
  expression.type === 'edition'
    ? expression.date
    : expression.author !== ''
      ? expression.author
      : expression.lang

/** Label naming a version of a text, e.g. "Edition 1719", "English translation" or "Realisation by Hill" */
export const longLabel = (expression: WorkExpression) => {
  if (expression.type === 'edition') return `Edition ${expression.date}`
  if (expression.type === 'translation') return `${expression.lang} translation`
  if (expression.type === 'realisation') return `Realisation by ${expression.author}`
  return shortLabel(expression)
}

/** Key of a work, e.g. "E♭ major" */
export const keyLabel = (key: WorkKey) =>
  `${key.pname?.toUpperCase() ?? ''}${key.accid === 'f' ? '♭' : key.accid === 's' ? '♯' : ''} ${key.mode ?? ''}`.trim()
