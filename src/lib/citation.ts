import { siteMetadata } from '@/lib/siteMetadata'
import { longLabel } from '@/lib/expressionLabels'
import type { EditionVersion, Expression } from '@/lib/types'

const MATTHESON = { display: 'Johann Mattheson', inverted: 'Mattheson, Johann' }

export const joinNames = (names: string[]) =>
  names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

const versionLabel = (version: EditionVersion) =>
  version.version
    ? `version ${version.version}`
    : version.commit
      ? `version ${version.commit}`
      : null

/** Title of a piece page, e.g. "Probstück 1 · Edition 1731" */
export const expressionTitle = (expression: Expression) =>
  expression.context
    ? `${expression.context.workTitle} · ${longLabel(expression.context.expression)}`
    : expression.header.title || expression.label || expression.expressionId || ''

/** Author of the text on a piece page: Mattheson for his prints and their translations */
const expressionAuthor = (expression: Expression) => {
  const type = expression.context?.expression.type
  if (type === 'edition' || type === 'translation') return MATTHESON
  return null
}

/** Citation of the whole edition, without access date and final full stop */
export const editionCitation = (version: EditionVersion) => {
  const parts = [
    siteMetadata.title,
    `Ed. by ${joinNames(siteMetadata.editors)}`,
    versionLabel(version)?.replace(/^v/, 'V'),
    siteMetadata.doi ? `https://doi.org/${siteMetadata.doi}` : null,
    `${siteMetadata.siteUrl}/`,
  ]
  return parts.filter(Boolean).join('. ')
}

/** Citation of a single piece page, without access date and final full stop */
export const expressionCitation = (expression: Expression, version: EditionVersion) => {
  const author = expressionAuthor(expression)
  const title = expression.context
    ? `${expression.context.workTitle} (${longLabel(expression.context.expression)})`
    : expressionTitle(expression)

  const translators = expression.header.editors.filter(e => e.role === 'translator').map(e => e.name)
  const editors = expression.header.editors.filter(e => e.role !== 'translator').map(e => e.name)

  const container = [`In: ${siteMetadata.title}`, versionLabel(version)].filter(Boolean).join(', ')

  const parts = [
    author ? `${author.display}: ${title}` : title,
    editors.length ? `Ed. by ${joinNames(editors)}` : null,
    translators.length ? `Transl. by ${joinNames(translators)}` : null,
    container,
    siteMetadata.doi ? `https://doi.org/${siteMetadata.doi}` : null,
    `${siteMetadata.siteUrl}/${expression.expressionId}/`,
  ]
  return parts.filter(Boolean).join('. ')
}

/** Highwire Press tags read by reference managers such as Zotero */
export const citationMetaTags = (expression: Expression) => {
  const author = expressionAuthor(expression)
  const tags: Record<string, string> = {
    citation_title: expressionTitle(expression),
    citation_publisher: siteMetadata.title,
    citation_language: expression.lang,
    citation_public_url: `${siteMetadata.siteUrl}/${expression.expressionId}/`,
  }
  if (author) tags.citation_author = author.inverted
  if (siteMetadata.doi) tags.citation_doi = siteMetadata.doi
  return tags
}
