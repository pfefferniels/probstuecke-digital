import React from 'react'
import Layout from "../components/Layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Card, CardContent, CardActions, Typography, Link, Stack, Paper, Chip } from '@mui/material';
import { OccurenceBox } from '../components/OccurenceBox';

const WorkCard = ({ work }: { work: Queries.bibliography }) => {
    return (
        <Card id={work.xmlId || 'no-id'} sx={{ p: 2 }} elevation={1}>
            <CardContent>
                <div style={{ float: 'left' }}>
                   {work.bibl}
                </div>
                <OccurenceBox forId={work.xmlId || ''} />
            </CardContent>
        </Card>
    )
};

const Bibliography = () => {
    const { allBibliography } = useStaticQuery<Queries.Query>(graphql`
        query {
          allBibliography {
            nodes {
              xmlId
              bibl
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
                            <WorkCard work={work} key={work.xmlId} />
                        )
                    })}
                </Stack>
            </Container>
        </Layout>
    )
}

export default Bibliography
