'use client'

import { Container, Card, CardContent, Typography, Link, Stack, Chip } from '@mui/material'
import { OccurenceBox } from '@/components/OccurenceBox'
import type { Person, ExpressionIndexData } from '@/lib/types'

interface PersonCardProps {
  person: Person
  expressions: ExpressionIndexData[]
}

const PersonCard = ({ person, expressions }: PersonCardProps) => {
  return (
    <Card id={person.xmlId || 'no-id'} sx={{ p: { xs: 0, sm: 1 } }} elevation={1}>
      <CardContent>
        <Typography variant="h5">
          {person.name}
        </Typography>
        {(person.birth || person.death) && (
          <Typography color="textSecondary">
            {person.birth} – {person.death}
          </Typography>
        )}
        {person.idno && (
          <Link href={person.idno} target="_blank" rel="noopener noreferrer">
            <Chip label="→ GND" size="small" color="info" />
          </Link>
        )}
        <OccurenceBox forId={person.xmlId || ''} expressions={expressions} />
      </CardContent>
    </Card>
  )
}

interface PersonsClientProps {
  persons: Person[]
  expressions: ExpressionIndexData[]
}

export default function PersonsClient({ persons, expressions }: PersonsClientProps) {
  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Index of Persons
      </Typography>
      <Stack spacing={2} direction="column">
        {persons.map(person => (
          <PersonCard person={person} key={person.xmlId} expressions={expressions} />
        ))}
      </Stack>
    </Container>
  )
}
