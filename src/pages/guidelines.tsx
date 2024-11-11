import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import Layout from "../components/Layout"
import Ceteicean from "gatsby-theme-ceteicean/src/components/Ceteicean"
import { Container } from "@mui/material"
import "./CETEI-guidelines.css"
import { Behavior } from "gatsby-theme-ceteicean/src/components/Behavior"

const Guidelines = () => {
    const data = useStaticQuery(graphql`
        query {
            guideline {
              transformed {
                original
                prefixed
                elements
              }
            }
        }`)

    const routes = {
        'teieg-egxml': (props: any) => {
            let xml = new XMLSerializer().serializeToString(props.teiNode)
            xml = xml.replaceAll('teieg-', '')
            xml = xml.replaceAll('data-', '')

            return (
                <Behavior node={props.teiNode}>
                    <pre style={{ fontSize: '0.8rem' }}>
                        {xml}
                    </pre>
                </Behavior>)
        }
    }

    return (
        <Layout location="Guidelines">
            <Container sx={{ marginTop: 5 }}>
                <Ceteicean pageContext={data.guideline.transformed} routes={routes} />
            </Container>
        </Layout>
    )
}

export default Guidelines