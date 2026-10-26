'use client'

import { Container, Typography } from '@mui/material'
import Link from 'next/link'
import Ceteicean from '@/ceteicean/Ceteicean'
import { CitationBox } from '@/components/CitationBox'
import { editionCitation } from '@/lib/citation'
import type { EditionVersion, TransformedTEI } from '@/lib/types'

interface AboutClientProps {
  transformed: TransformedTEI
  version: EditionVersion
}

export default function AboutClient({ transformed, version }: AboutClientProps) {
  return (
    <Container className="about" sx={{ marginTop: 4, marginBottom: 6, maxWidth: '52rem !important' }}>
      <Ceteicean pageContext={transformed} />

      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
        How to Cite
      </Typography>
      <Typography sx={{ mb: 1.5 }}>
        Please cite the edition as follows. Every page of a Probstück has its own citation under “About this text”.
      </Typography>
      <CitationBox citation={editionCitation(version)} />

      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mt: 4, mb: 1 }}>
        Contact
      </Typography>
      <Typography>
        Contact details are given in the <Link href="/imprint/">imprint</Link>.
      </Typography>
    </Container>
  )
}
