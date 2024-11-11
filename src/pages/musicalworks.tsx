import React from 'react'
import Layout from "../components/Layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Typography, Stack } from '@mui/material';
import { BiblCard } from '../components/BiblCard';

const MusicalWorks = () => {
    const { allMusicalWork } = useStaticQuery<Queries.Query>(graphql`
        query {
          allMusicalWork {
            nodes {
              xmlId
              title
              author {
                surname
                forename
              }
              pubPlace
              date
              link
            }
          }
        }
    `)

    return (
        <Layout location="Musical Works">
            <Container>
                <Typography variant="h5" gutterBottom>
                    Index of Musical Works
                </Typography>
                <Stack spacing={2} direction='column'>
                    {allMusicalWork.nodes.map(work => {
                        return (
                            <BiblCard work={work} key={work.xmlId} />
                        )
                    })}
                </Stack>
            </Container>
        </Layout>
    )
}

export default MusicalWorks
