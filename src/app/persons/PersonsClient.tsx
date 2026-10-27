'use client'

import { Box, Container, Card, CardContent, Typography, Link, Stack, Chip } from '@mui/material'
import { OccurenceBox } from '@/components/OccurenceBox'
import type { Person, ExpressionIndexData } from '@/lib/types'

interface PersonCardProps {
  person: Person
  expressions: ExpressionIndexData[]
}

const PersonCard = ({ person, expressions }: PersonCardProps) => {
  return (
    <Card id={person.xmlId || 'no-id'} sx={{ p: { xs: 0, sm: 2 } }} elevation={1}>
      <CardContent>
        {/* on phones the occurrences go below */}
        <Box sx={{ float: { sm: 'left' }, mb: { xs: 2, sm: 0 } }}>
          <Typography variant="h5">
            {person.name}
          </Typography>
          <Typography color="textSecondary">
            {person.birth} - {person.death}
          </Typography>
          <Link href={person.idno || ''} target="_blank" rel="noopener noreferrer">
            <Chip label="→ GND" size="small" color="info" />
          </Link>
        </Box>
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
