import React from "react"
import { useStaticQuery, graphql } from "gatsby"

import { Head } from "./Head";
import { Header } from "./Header"
import { Footer } from "./Footer"

import styled from '@emotion/styled'

type Children = JSX.Element | JSX.Element[]

interface Props {
    location?: string
    children?: Children
}

const Main = styled.div(() => ({
    minHeight: "65vh",
    "& h2, & h3": {
        paddingBottom: '1rem'
    }
}))

const Layout = ({ location, children }: Props) => {
    const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          subtitle
        }
      }
    }
  `)

    const { title, subtitle } = data.site.siteMetadata

    return (
        <div>
            <Head title={location || ""} />

            <Header title={title} subtitle={subtitle} />
            <Main>{children}</Main>
            <Footer />
        </div>
    );
}

export default Layout
