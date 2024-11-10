import React from 'react'
import Layout from "../components/Layout"
import { graphql, useStaticQuery } from 'gatsby'
import { Container, Card, CardContent, Typography, Stack } from '@mui/material';
import { OccurenceBox } from '../components/OccurenceBox';

const WorkCard = ({ work }: { work: Queries.musicalWork }) => {
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

const MusicalWorks = () => {
    const { allMusicalWork } = useStaticQuery<Queries.Query>(graphql`
        query {
          allMusicalWork {
            nodes {
              xmlId
              bibl
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
                            <WorkCard work={work} key={work.xmlId} />
                        )
                    })}
                </Stack>
            </Container>
        </Layout>
    )
}

export default MusicalWorks
