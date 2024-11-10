import React from 'react'
import Layout from "../components/Layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Card, CardContent, CardActions, Typography, Link, Stack } from '@mui/material';

const PersonCard = ({ person }: { person: Queries.person }) => (
        <Card id={person.xmlId || 'no-id'}>
            <CardContent>
                <Typography variant="h5">
                    {person.forename} {person.surname}
                </Typography>
                <Typography color="textSecondary">
                    {person.birth} - {person.death}
                </Typography>
            </CardContent>
            <CardActions>
                <Link href={person.idno || ''} target="_blank" rel="noopener noreferrer">
                    Link to GND
                </Link>
            </CardActions>
        </Card>
);

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
