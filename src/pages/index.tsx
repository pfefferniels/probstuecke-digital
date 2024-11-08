import React from 'react'
import Layout from "../components/Layout"
import { HeadFC, graphql, useStaticQuery } from 'gatsby'
import { Container, Grid, Grid2 } from '@mui/material'
import { WorkCard } from '../components/WorkCard'
import backgroundImage from "../images/start-bg.png"

const IndexPage = () => {
    const { allWork, allExpression } = useStaticQuery<Queries.Query>(graphql`
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
            }
          }
          allExpression {
            nodes {
                expressionId
                derivationType
                label
                realises
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
                            const expressions = allExpression.nodes
                                .filter(node => {
                                    return node.realises?.slice(1) === work.xmlId
                                })
                                .sort((a, b) => a.derivationType?.localeCompare(b.derivationType!) || 0)
                                .reduce((acc, current) => {
                                    const index = current.derivationType || 'unknown'
                                    if (Array.isArray(acc[index])) {
                                        acc[index].push(current)
                                    }
                                    else {
                                        acc[current.derivationType || 'unknown'] = [current]
                                    }
                                    acc[index].sort((a, b) => a.label?.localeCompare(b.label!) || 0)
                                    return acc
                                }, {} as { [index: string]: Queries.expression[] })

                            return (
                                <Grid2 size={{ xs: 2, sm: 4, md: 4 }} key={work.id}>
                                    <WorkCard
                                        title={work.title || 'unknown work'}
                                        keySignature={work.key!}
                                        incipitSVG={work.incipitSvg!}
                                        expressions={expressions} />
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
