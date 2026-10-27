export interface TransformedTEI {
  original: string
  prefixed: string
  elements: string[]
}

export interface ExpressionMei {
  xmlId: string
  mei: string
}

/** An audio recording that a text points to (ptr[@type="audio"] or media) */
export interface ExpressionMedia {
  /** the file as the TEI names it (ptr/@target, media/@url) */
  target: string
  /** where the static export serves the file */
  url: string
  mimeType: string | null
  /** size of the file, if it is in the data */
  bytes: number | null
  /** what is heard, from the description of the action in a lesson, e.g. "Robert Hill spielt Takt 1" */
  label: string | null
}

/** A participant of a lesson (particDesc), whom @who of an utterance or action points to */
export interface Participant {
  xmlId: string | null
  name: string
  role: string | null
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
  participants: Participant[]
  /** where and when a lesson took place (settingDesc), e.g. "17 May 2019, Hochschule für Musik, …" */
  setting: string | null
}

/** A translation side by side with its original, sentence by sentence (see helpers/alignTranslation) */
export interface ParallelText {
  /** the translation's text, each group of sentences in a <seg type="pair"> with those of the original */
  text: TransformedTEI
  /** expression ID of the original, e.g. ps1-002 */
  originalId: string | null
  /** entries of the index of terms that the sentences of the original point to */
  termIds: string[]
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
  parallel: ParallelText | null
  mei: ExpressionMei[]
  media: ExpressionMedia[]
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

/** A passage listed for a term: a page reference of Mattheson's Register or one added by the editors */
export interface TermOccurrence {
  type: 'register' | 'editorial'
  /** page of the 1731 print */
  page: string | null
  /** number of the Probstück */
  piece: string | null
  /** expression of the 1731 text, e.g. ps9-002 */
  expressionId: string | null
  /** xml:id of the place in the text, if any */
  target: string | null
  /** word: a tagged word; passage: a paragraph; music: the score or a music example; text: only the Probstück */
  targetKind: 'word' | 'passage' | 'music' | 'text'
  /** quotation from the passage, the indexed word marked */
  quote: { pre: string; key: string; post: string } | null
  /** xml:id of the entry in Mattheson's Register */
  registerEntry: string | null
}

export interface Term {
  xmlId: string
  /** modern German form */
  label: string
  /** Mattheson's headwords in the Register */
  orig: string[]
  gloss: string
  /** xml:ids of the entries in the Register */
  registerEntries: string[]
  occurrences: TermOccurrence[]
}

/** what a tagged term shows in the text */
export interface TermSummary {
  label: string
  gloss: string
}

export interface Register {
  transformed: TransformedTEI
  /** xml:id of an index entry → route of its index page, e.g. "persons" */
  indexRoutes: Record<string, string>
}

export interface ExpressionIndexData {
  expressionId: string | null
  label: string | null
  indexRefs: IndexRef[]
}
