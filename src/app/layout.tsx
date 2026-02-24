import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { siteMetadata } from '@/lib/siteMetadata'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Probstücke Digital', template: '%s | Probstücke Digital' },
  description: siteMetadata.subtitle,
  openGraph: { title: 'Probstücke Digital', description: siteMetadata.subtitle, type: 'website' },
  twitter: { card: 'summary', title: 'Probstücke Digital', description: siteMetadata.subtitle },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div>
          <Header title={siteMetadata.title} subtitle={siteMetadata.subtitle} />
          <div style={{ minHeight: '65vh' }}>
            <style>{`
              div h2, div h3 {
                padding-bottom: 1rem;
              }
            `}</style>
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  )
}
