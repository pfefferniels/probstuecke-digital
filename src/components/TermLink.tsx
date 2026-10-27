import Link from 'next/link'
import type { ReactNode } from 'react'
import { Tooltip } from '@mui/material'
import type { TermSummary } from '@/lib/types'

interface TermLinkProps {
  teiNode: Element
  terms: Record<string, TermSummary>
  children?: ReactNode
}

/**
 * A word tagged for the index of terms (<term corresp="#t_…">). Pointing at it
 * shows the entry; a click or tap leads to it in the index. A word indexed under
 * several entries links to the first.
 */
const TermLink = ({ teiNode, terms, children }: TermLinkProps) => {
  const ids = (teiNode.getAttribute('corresp') || '')
    .split(/\s+/)
    .filter((token) => token.startsWith('#'))
    .map((token) => token.slice(1))
  const entries = ids.map((id) => terms[id]).filter(Boolean)

  if (ids.length === 0) return <span>{children}</span>

  const title = (
    <>
      {entries.map((entry, i) => (
        <div key={i}>
          Index of terms: <strong>{entry.label}</strong>
          {entry.gloss && <> – {entry.gloss}</>}
        </div>
      ))}
    </>
  )

  return (
    <Tooltip title={title} placement="bottom">
      <Link href={`/terms/#${ids[0]}`} className="term" id={teiNode.getAttribute('id') || undefined}>
        {children}
      </Link>
    </Tooltip>
  )
}

export default TermLink
