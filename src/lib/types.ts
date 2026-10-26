export interface TransformedTEI {
  original: string
  prefixed: string
  elements: string[]
}

export interface ExpressionMei {
  xmlId: string
  mei: string
}

export interface ExpressionZone {
  xmlId: string | null
  imageApiUrl: string
}

export interface IndexRef {
  xmlId: string | null
  corresp: string
}

export interface TextHeader {
  title: string | null
  editors: { name: string; role: string | null }[]
  source: string | null
  copy: {
    shelfmark: string | null
    catalogue: string | null
    iiif: string | null
    urn: string | null
  } | null
  licence: { url: string | null; label: string | null } | null
}

export interface ExpressionContext {
  workTitle: string
  key: WorkKey
  expression: WorkExpression
  siblings: WorkExpression[]
}

export interface Expression {
  expressionId: string | null
  isFraktur: boolean
  label: string | null
  score: TransformedTEI | null
  title: TransformedTEI | null
  text: TransformedTEI | null
  mei: ExpressionMei[]
  zones: ExpressionZone[]
  refTargets: (string | null)[]
  indexRefs: IndexRef[]
  sourcePath: string
  lang: string
  header: TextHeader
  context: ExpressionContext | null
}

export interface WorkExpression {
  date: string
  type: string
  id: string
  referringTo: string[]
  lang: string
  langCode: string
  author: string
}

export interface WorkKey {
  pname?: string
  accid?: string
  mode?: string
}

export interface Work {
  xmlId: string | null
  title: string
  incipitSvg: string
  key: WorkKey
  expressions: WorkExpression[]
}

export interface PersName {
  surname: string
  forename: string
}

export interface Person {
  xmlId: string
  name: string
  surname: string
  forename: string
  birth: string
  death: string
  idno: string
}

export interface Bibliography {
  xmlId: string
  title: string
  author?: PersName
  editor?: PersName
  pubPlace: string
  date: string
  link: string
}

export interface MusicalWork {
  xmlId: string
  title: string
  author?: PersName
  pubPlace: string
  date: string
  link: string
}

export interface Guideline {
  transformed: TransformedTEI
}

export interface About {
  transformed: TransformedTEI
}

export interface EditionVersion {
  version: string | null
  commit: string | null
  buildDate: string
}

export interface ExpressionIndexData {
  expressionId: string | null
  label: string | null
  indexRefs: IndexRef[]
}
