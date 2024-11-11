import React from 'react'
import Layout from "../components/Layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Typography, Stack } from '@mui/material';
import { BiblCard } from '../components/BiblCard';

const Bibliography = () => {
    const { allBibliography } = useStaticQuery<Queries.Query>(graphql`
        query {
          allBibliography {
            nodes {
              xmlId
              title
              author {
                surname
                forename
              }
              editor {
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
        <Layout location="Bibliography">
            <Container>
                <Typography variant="h5" gutterBottom>
                    Bibliography
                </Typography>
                <Stack spacing={2} direction='column'>
                    {allBibliography.nodes.map(work => {
                        return (
                            <BiblCard work={work} key={work.xmlId} />
                        )
                    })}
                </Stack>
            </Container>
        </Layout>
    )
}

export default Bibliography
