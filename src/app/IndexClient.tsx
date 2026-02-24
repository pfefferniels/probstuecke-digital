'use client'

import { Container, Grid } from '@mui/material'
import { type ExpressionsByCategory, WorkCard } from '@/components/WorkCard'
import type { Work } from '@/lib/types'

interface IndexClientProps {
  works: Work[]
}

export default function IndexClient({ works }: IndexClientProps) {
  return (
    <div style={{ background: 'url(/start-bg.png)', minHeight: '85vh' }}>
      <Container>
        <Grid
          container
          padding={9}
          spacing={{ xs: 2, sm: 2, md: 3 }}
          columns={{ xs: 2, sm: 8, md: 12 }}
        >
          {works.map(work => {
            const expressions = work.expressions
            if (!expressions) return null

            const byCategory = expressions
              .slice()
              .sort((a, b) => a?.type?.localeCompare(b?.type ?? '') || 0)
              .reduce((acc, current) => {
                if (!current) return acc

                const index = current.type || 'unknown'
                if (Array.isArray(acc[index])) {
                  acc[index].push(current)
                } else {
                  acc[current.type || 'unknown'] = [current]
                }
                acc[index].sort((a, b) => a.date?.localeCompare(b.date!) || 0)
                return acc
              }, {} as ExpressionsByCategory)

            return (
              <Grid size={{ xs: 2, sm: 4, md: 4 }} key={work.xmlId}>
                <WorkCard
                  title={work.title || 'unknown work'}
                  keySignature={work.key!}
                  incipitSVG={work.incipitSvg!}
                  expressions={byCategory}
                />
              </Grid>
            )
          })}
        </Grid>
      </Container>
    </div>
  )
}
