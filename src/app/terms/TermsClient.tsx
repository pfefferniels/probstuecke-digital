'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { Box, Card, CardContent, Chip, Container, Stack, TextField, Typography } from '@mui/material'
import { characterRules } from '@/helpers/normalise'
import type { Term, TermOccurrence } from '@/lib/types'

// the quotations and Mattheson's headwords are diplomatic; show them with round s and umlauts
const readable = (text: string) => characterRules(text)

const initial = (label: string) =>
  label.normalize('NFD').replace(/[^\p{L}]/gu, '').charAt(0).toUpperCase()

const matches = (term: Term, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [term.label, term.gloss, ...term.orig.map(readable)].some((text) => text.toLowerCase().includes(q))
}

const Occurrence = ({ occurrence }: { occurrence: TermOccurrence }) => {
  const { page, piece, expressionId, target, targetKind, quote, type } = occurrence
  const href = expressionId ? `/${expressionId}/${target ? `#${target}` : ''}` : null
  const where = `Probstück ${piece}`

  let note: string | null = null
  if (targetKind === 'music') note = target === 'score' ? 'score' : 'music example'
  else if (targetKind === 'passage') note = 'the passage'
  else if (targetKind === 'text') note = quote ? 'not yet linked to the word' : 'passage not identified'

  return (
    <li className="occurrence">
      <span className="page">{page ? `p. ${page}` : ''}</span>
      <span>
        {href ? <Link href={href}>{where}</Link> : where}
        {quote && (
          <span className="quote" lang="de">
            {' '}… {readable(quote.pre)}<strong>{readable(quote.key)}</strong>{readable(quote.post)} …
          </span>
        )}
        {note && <span className="note"> ({note})</span>}
        {type === 'editorial' && (
          <Chip
            component="span"
            size="small"
            variant="outlined"
            label="added by the editors"
            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
          />
        )}
      </span>
    </li>
  )
}

const TermCard = ({ term }: { term: Term }) => {
  const register = term.occurrences.filter((o) => o.type === 'register')
  const editorial = term.occurrences.filter((o) => o.type === 'editorial')

  return (
    <Card id={term.xmlId} sx={{ p: { xs: 0, sm: 1 }, scrollMarginTop: '1rem' }} elevation={1}>
      <CardContent>
        <Typography variant="h6" component="h3" lang="de" sx={{ pb: '0 !important' }}>
          {term.label}
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 1 }}>
          {term.gloss && <span lang="en">{term.gloss}</span>}
          {term.gloss && term.orig.length > 0 && ' · '}
          {term.orig.length > 0 && (
            <>
              Mattheson’s Register:{' '}
              {term.orig.map((orig, i) => (
                <Fragment key={orig}>
                  {i > 0 && ', '}
                  {term.registerEntries.length > 0 ? (
                    <Link href={`/register/#${term.registerEntries[Math.min(i, term.registerEntries.length - 1)]}`} lang="de">
                      <i>{readable(orig)}</i>
                    </Link>
                  ) : (
                    <i lang="de">{readable(orig)}</i>
                  )}
                </Fragment>
              ))}
            </>
          )}
        </Typography>
        {register.length > 0 && (
          <ul className="occurrences" aria-label="References in Mattheson’s Register">
            {register.map((o, i) => <Occurrence key={`r${i}`} occurrence={o} />)}
          </ul>
        )}
        {editorial.length > 0 && (
          <ul className="occurrences" aria-label="Further references">
            {editorial.map((o, i) => <Occurrence key={`e${i}`} occurrence={o} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

interface TermsClientProps {
  terms: Term[]
}

export default function TermsClient({ terms }: TermsClientProps) {
  const [query, setQuery] = useState('')
  const shown = useMemo(() => terms.filter((term) => matches(term, query)), [terms, query])
  const letters = useMemo(() => Array.from(new Set(terms.map((t) => initial(t.label)))), [terms])
  const registerCount = terms.reduce((n, t) => n + t.occurrences.filter((o) => o.type === 'register').length, 0)

  return (
    <Container className="terms" sx={{ mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Index of Terms
      </Typography>
      <Typography sx={{ maxWidth: '50rem', mb: 2 }}>
        The index is based on the Register that Mattheson added to the <i>Grosse General-Baß-Schule</i> of 1731.
        It takes up the {terms.length} subject entries that refer to the Ober-Classe, under a modern German
        headword with Mattheson’s headword and an English gloss, and lists the {registerCount} page references
        he gives, linked to the passages in the 1731 text. A few passages Mattheson does not list have been added
        by the editors. Page numbers are those of the 1731 print. Words listed here are underlined in the text;
        point at them to see the entry. See also the <Link href="/register/">transcription of the Register</Link>.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Filter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        {!query && (
          <Box component="nav" aria-label="Initial letters" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {letters.map((letter) => (
              <a key={letter} href={`#letter-${letter}`}>{letter}</a>
            ))}
          </Box>
        )}
        {query && <Typography color="textSecondary">{shown.length} of {terms.length} terms</Typography>}
      </Box>

      <Stack spacing={2} direction="column">
        {shown.map((term, i) => {
          const letter = initial(term.label)
          const first = !query && (i === 0 || initial(shown[i - 1].label) !== letter)
          return (
            <Fragment key={term.xmlId}>
              {first && (
                <Typography variant="h6" component="h2" id={`letter-${letter}`} sx={{ pt: 1, pb: '0 !important' }}>
                  {letter}
                </Typography>
              )}
              <TermCard term={term} />
            </Fragment>
          )
        })}
      </Stack>
    </Container>
  )
}
