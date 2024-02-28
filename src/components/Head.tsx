import React from "react"
import { useStaticQuery, graphql } from "gatsby"

interface HeadProps {
  description?: string
  lang?: string
  meta?: []
  title?: string
}

export const Head = ({ description, lang, title }: HeadProps) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const fullTitle = `${title} | ${site.siteMetadata.title}` 

  return (
    <>
      <html lang={lang} />
      <body/>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="og:title" content={fullTitle} />
      <meta name="og:description" content={metaDescription} />
      <meta name="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
    </>
  )
}
