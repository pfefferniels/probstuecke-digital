import Container from "@mui/material/Container"
import { Box, Typography } from "@mui/material"
import Link from "next/link"
import { siteMetadata } from "@/lib/siteMetadata"
import { loadEditionVersion } from "@/lib/editionVersion"
import { joinNames } from "@/lib/citation"

const styles = {
  footer: {
    backgroundColor: "#efefef",
    padding: "1.5rem 0",
    borderTop: "1px solid #dadada",
    fontSize: "1rem"
  },
  links: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem 1.25rem",
    margin: "0.75rem 0",
  },
}

export const Footer = () => {
  const version = loadEditionVersion()

  return (
    <Box component="footer" sx={styles.footer}>
      <Container maxWidth="lg">
        <Typography>
          <i>{siteMetadata.title}</i>, edited by {joinNames(siteMetadata.editors)}.
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Transcriptions, translation and encodings:{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
          Page images: Bayerische Staatsbibliothek, Munich,{' '}
          <a href="https://rightsstatements.org/vocab/NoC-NC/1.0/">No Copyright – Non-Commercial Use Only</a>.
          Website code: MIT licence.
        </Typography>
        <Box component="nav" aria-label="Footer" sx={styles.links}>
          <Link href="/about/">About the edition</Link>
          <Link href="/guidelines/">Editorial guidelines</Link>
          <Link href="/imprint/">Imprint and privacy</Link>
          <a href={siteMetadata.dataRepository}>Data (TEI and MEI) on GitHub</a>
          <a href={siteMetadata.codeRepository}>Website code on GitHub</a>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {version.version && <>Data version {version.version}</>}
          {version.commit && <> ({version.commit})</>}
          {(version.version || version.commit) && ' · '}
          Built {version.buildDate}
          {siteMetadata.doi && (
            <> · DOI: <a href={`https://doi.org/${siteMetadata.doi}`}>{siteMetadata.doi}</a></>
          )}
        </Typography>
      </Container>
    </Box>
  )
}
