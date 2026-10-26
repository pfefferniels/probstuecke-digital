'use client'

import { Container, Link, Typography } from '@mui/material'
import { siteMetadata } from '@/lib/siteMetadata'

const Heading = ({ children }: { children: string }) => (
  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mt: 4, mb: 1 }}>
    {children}
  </Typography>
)

export default function ImprintClient() {
  const { imprint } = siteMetadata

  return (
    <Container sx={{ marginTop: 4, marginBottom: 6, maxWidth: '52rem !important' }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
        Imprint
      </Typography>
      <Typography sx={{ mb: 2 }}>Information pursuant to § 5 DDG (Digitale-Dienste-Gesetz)</Typography>
      <Typography component="address" sx={{ fontStyle: 'normal', mb: 2 }}>
        {imprint.name}
        {imprint.address.length > 0
          ? imprint.address.map(line => <span key={line}><br />{line}</span>)
          : <><br />[Postal address to be added]</>}
      </Typography>
      <Typography>
        Email: {imprint.email
          ? <Link href={`mailto:${imprint.email}`}>{imprint.email}</Link>
          : '[to be added]'}
      </Typography>
      <Typography sx={{ mt: 2 }}>
        Responsible for the content: {imprint.name}
      </Typography>

      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mt: 6, mb: 2 }}>
        Privacy
      </Typography>

      <Heading>Hosting</Heading>
      <Typography>
        This website is a static site hosted on GitHub Pages, a service of GitHub, Inc. (USA). When you open a page,
        GitHub processes the technical data needed to deliver it, including your IP address, and may keep it in server
        logs for security purposes. See the{' '}
        <Link href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">
          GitHub General Privacy Statement
        </Link>.
      </Typography>

      <Heading>Page images</Heading>
      <Typography>
        When you point at a line of music, your browser loads that part of the page image directly from the IIIF server
        of the Bayerische Staatsbibliothek (api.digitale-sammlungen.de). The library receives your IP address and the
        request. See the{' '}
        <Link href="https://www.bsb-muenchen.de/datenschutz/" target="_blank" rel="noopener noreferrer">
          privacy statement of the Bayerische Staatsbibliothek
        </Link>.
      </Typography>

      <Heading>No cookies or tracking</Heading>
      <Typography>
        This website sets no cookies, uses no analytics or tracking services, and loads no fonts or scripts from other
        servers. The search runs entirely in your browser.
      </Typography>

      <Heading>Your rights</Heading>
      <Typography>
        Under the General Data Protection Regulation you have the right to access, rectification, erasure, restriction
        of processing and objection, and the right to lodge a complaint with a data protection supervisory authority.
        To exercise these rights, contact the person named in the imprint.
      </Typography>
    </Container>
  )
}
