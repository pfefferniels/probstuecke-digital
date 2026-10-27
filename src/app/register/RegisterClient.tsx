'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Container, Typography } from '@mui/material'
import Ceteicean from '@/ceteicean/Ceteicean'
import { Word } from '@/components/Word'
import type { Register } from '@/lib/types'

const INDEX_LABELS: Record<string, string> = {
  terms: 'Index of terms',
  persons: 'Index of persons',
  musicalworks: 'Index of musical works',
  bibliography: 'Bibliography',
}

const DIGITAL_COPY = 'https://www.digitale-sammlungen.de/en/view/bsb10598495?page=527'

interface RegisterClientProps {
  register: Register
}

interface EntryProps {
  teiNode: Element
  indexRoutes: Record<string, string>
  children?: ReactNode
}

// an entry of the Register, linked to its entry in one of the indices
const Entry = ({ teiNode, indexRoutes, children }: EntryProps) => {
  const id = teiNode.getAttribute('id') || undefined
  const target = teiNode.getAttribute('corresp')?.replace(/^#/, '')
  const route = target ? indexRoutes[target] : undefined
  return (
    <div className="entry" id={id}>
      <span lang="de">{children}</span>
      {route && (
        <Link className="toIndex" href={`/${route}/#${target}`}>
          → {INDEX_LABELS[route]}
        </Link>
      )}
    </div>
  )
}

export default function RegisterClient({ register }: RegisterClientProps) {
  const routes = {
    'tei-w': Word,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'tei-item': (props: any) => <Entry {...props} indexRoutes={register.indexRoutes} />,
  }

  return (
    <Container className="register" sx={{ mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Mattheson’s Register (1731)
      </Typography>
      <Typography sx={{ maxWidth: '50rem', mb: 3 }}>
        The Register of the <i>Grosse General-Baß-Schule</i> (Hamburg 1731, pp. 465–482), transcribed from the copy
        of the Bayerische Staatsbibliothek (<a href={DIGITAL_COPY} target="_blank" rel="noopener noreferrer">digital copy</a>).
        It indexes the whole volume; pages 302–464 belong to the Ober-Classe. Entries that refer to the
        Ober-Classe lead to the <Link href="/terms/">index of terms</Link>, entries about persons and works to the
        other indices. As in the commentary, the spelling is shown modernised; point at a word to see the original.
        Numbers in brackets are the pages of the Register.
      </Typography>
      <Ceteicean pageContext={register.transformed} routes={routes} />
    </Container>
  )
}
