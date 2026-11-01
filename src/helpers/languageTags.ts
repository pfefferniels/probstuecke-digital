/**
 * The encodings give languages by the three-letter codes of ISO 639-3, as the DTA Base
 * Format prescribes (deu, lat, …). HTML wants BCP 47 tags, which use the two-letter code
 * of a language where it has one (de, la, …).
 */

const TWO_LETTER: Record<string, string> = { deu: 'de', eng: 'en', fra: 'fr', ita: 'it', lat: 'la' }

/** The BCP 47 tag for a language code of the encodings, e.g. "la" for "lat"; grc stays grc */
export const languageTag = (code: string) => TWO_LETTER[code] ?? code
