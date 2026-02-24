'use client'

import { Container, Typography, Stack } from '@mui/material'
import { BiblCard } from '@/components/BiblCard'
import type { Bibliography, ExpressionIndexData } from '@/lib/types'

interface BibliographyClientProps {
  bibliography: Bibliography[]
  expressions: ExpressionIndexData[]
}

export default function BibliographyClient({ bibliography, expressions }: BibliographyClientProps) {
  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Bibliography
      </Typography>
      <Stack spacing={2} direction="column">
        {bibliography.map(work => (
          <BiblCard work={work} key={work.xmlId} expressions={expressions} />
        ))}
      </Stack>
    </Container>
  )
}
