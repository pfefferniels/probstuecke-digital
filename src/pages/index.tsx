import React from 'react'
import Layout from "../components/Layout"
import { HeadFC, graphql, useStaticQuery } from 'gatsby'
import { Container, Grid2 } from '@mui/material'
import { ExpressionsByCategory, WorkCard } from '../components/WorkCard'
import backgroundImage from "../images/start-bg.png"

const IndexPage = () => {
    const { allWork } = useStaticQuery<Queries.Query>(graphql`
        query {
          allWork {
            nodes {
              xmlId
              title
              incipitSvg
              key {
                pname 
                mode
              }
              expressions {
                type 
                date
                lang
                id
                referringTo
              }
            }
          }
        }
    `)

    return (
        <Layout location="IndexPage">
            <div style={{ background: `url(${backgroundImage})`, minHeight: '85vh' }}>
                <Container>
                    <Grid2
                        container
                        padding={3}
                        spacing={{ xs: 2, sm: 2, md: 3 }}
                        columns={{ xs: 2, sm: 8, md: 12 }}>
                        {allWork.nodes.map(work => {
                            const expressions = work.expressions
                            console.log(expressions)
                            if (!expressions) return null

                            const byCategory = expressions
                                .slice()
                                .sort((a, b) => a?.type?.localeCompare(b?.type!) || 0)
                                .reduce((acc, current) => {
                                    if (!current) return acc

                                    const index = current.type || 'unknown'
                                    if (Array.isArray(acc[index])) {
                                        acc[index].push(current)
                                    }
                                    else {
                                        acc[current.type || 'unknown'] = [current]
                                    }
                                    acc[index].sort((a, b) => a.date?.localeCompare(b.date!) || 0)
                                    return acc
                                }, {} as ExpressionsByCategory)

                            return (
                                <Grid2 size={{ xs: 2, sm: 4, md: 4 }} key={work.id}>
                                    <WorkCard
                                        title={work.title || 'unknown work'}
                                        keySignature={work.key!}
                                        incipitSVG={work.incipitSvg!}
                                        expressions={byCategory} />
                                </Grid2>
                            )
                        })}
                    </Grid2>
                </Container>
            </div>
        </Layout >
    )
}

export default IndexPage

export const Head: HeadFC = () => <title>Home | Probstücke Digital</title>
