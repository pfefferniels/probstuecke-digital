'use client'

import { Container, Typography, Stack } from '@mui/material'
import { BiblCard } from '@/components/BiblCard'
import type { MusicalWork, ExpressionIndexData } from '@/lib/types'

interface MusicalWorksClientProps {
  musicalWorks: MusicalWork[]
  expressions: ExpressionIndexData[]
}

export default function MusicalWorksClient({ musicalWorks, expressions }: MusicalWorksClientProps) {
  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Index of Musical Works
      </Typography>
      <Stack spacing={2} direction="column">
        {musicalWorks.map(work => (
          <BiblCard work={work} key={work.xmlId} expressions={expressions} />
        ))}
      </Stack>
    </Container>
  )
}
