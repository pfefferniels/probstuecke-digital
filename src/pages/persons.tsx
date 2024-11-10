import React from 'react'
import Layout from "../components/Layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Card, CardContent, CardActions, Typography, Link, Stack, Paper, Chip } from '@mui/material';
import { OccurenceBox } from '../components/OccurenceBox';

const PersonCard = ({ person }: { person: Queries.person }) => {
    return (
        <Card id={person.xmlId || 'no-id'} sx={{ p: 2 }} elevation={1}>
            <CardContent>
                <div style={{ float: 'left' }}>
                    <Typography variant="h5">
                        {person.forename} {person.surname}
                    </Typography>
                    <Typography color="textSecondary">
                        {person.birth} - {person.death}
                    </Typography>
                    <Link href={person.idno || ''} target="_blank" rel="noopener noreferrer">
                        <Chip label="→ GND" size='small' color='info' />
                    </Link>
                </div>
                <OccurenceBox forId={person.xmlId || ''} />
            </CardContent>
        </Card>
    )
};

const Persons = () => {
    const { allPerson } = useStaticQuery<Queries.Query>(graphql`
        query {
          allPerson {
            nodes {
              xmlId
              surname 
              forename
              birth
              death
              idno
            }
          }
        }
    `)

    return (
        <Layout location="Persons">
            <Container>
                <Typography variant="h5" gutterBottom>
                    Index of Persons
                </Typography>
                <Stack spacing={2} direction='column'>
                    {allPerson.nodes.map(person => {
                        return (
                            <PersonCard person={person} key={person.xmlId} />
                        )
                    })}
                </Stack>
            </Container>
        </Layout>
    )
}

export default Persons
