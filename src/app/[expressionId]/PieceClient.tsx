'use client'

import { useState, useEffect } from 'react'
import { NotatedMusic } from '@/components/NotatedMusic'
import Ceteicean from '@/ceteicean/Ceteicean'
import { Behavior } from '@/ceteicean/Behavior'
import { Grid, IconButton } from '@mui/material'
import { Word } from '@/components/Word'
import { VerovioProvider } from '@/hooks/useVerovio'
import { Ref } from '@/components/Ref'
import { GlowDefs } from '@/components/GlowDefs'
import LinkToIndex from '@/components/LinkToIndex'
import { Download } from '@mui/icons-material'
import { DownloadDialog } from '@/components/DownloadDialog'
import type { Expression, ExpressionZone } from '@/lib/types'

interface PieceClientProps {
  piece: Expression
}

export default function PieceClient({ piece }: PieceClientProps) {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)

  const routes = {
    'tei-notatedmusic': (node: any) => (
      <Behavior node={node}>
        <NotatedMusic
          teiNode={node.teiNode}
          meis={piece.mei || []}
          zones={(piece.zones?.filter(zone => !!zone) || []) as ExpressionZone[]}
          refs={piece.refTargets || []}
          expressionId={piece.expressionId || undefined}
        />
      </Behavior>
    ),
    'tei-w': Word,
    'tei-ref': Ref,
    'tei-persname': (props: any) => <LinkToIndex type="persons" {...props} />,
    'tei-name': (props: any) => <LinkToIndex type="musicalworks" {...props} />,
    'tei-bibl': (props: any) => <LinkToIndex type="bibliography" {...props} />,
  }

  useEffect(() => {
    const pdfkitScript = document.createElement('script')
    pdfkitScript.type = 'application/javascript'
    pdfkitScript.src = '/pdfkit.standalone.js'
    document.body.appendChild(pdfkitScript)

    const blobstreamScript = document.createElement('script')
    blobstreamScript.type = 'application/javascript'
    blobstreamScript.src = '/blob-stream.js'
    document.body.appendChild(blobstreamScript)

    const pdfKitHandler = () => {
      // PDFKit initialized
    }

    pdfkitScript.defer = true
    pdfkitScript.addEventListener('load', pdfKitHandler)

    blobstreamScript.defer = true
    blobstreamScript.addEventListener('load', () => {})

    return () => {
      pdfkitScript.removeEventListener('load', pdfKitHandler)
    }
  }, [])

  return (
    <>
      <div className="piece">
        <GlowDefs />

        <h2 className="title" style={{ textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '0', right: '1rem' }}>
            <IconButton color="primary" onClick={() => setDownloadDialogOpen(true)}>
              <Download />
            </IconButton>
          </div>

          <Ceteicean
            pageContext={piece.title as any}
            routes={{
              'tei-w': Word,
            }}
          />
        </h2>

        <VerovioProvider>
          <Grid container spacing={1}>
            <Grid size={6} className="scoreView">
              <Ceteicean pageContext={piece.score as any} routes={routes} />
            </Grid>
            <Grid size={6} p={1.5}>
              <Ceteicean pageContext={piece.text as any} routes={routes} />
            </Grid>
          </Grid>
        </VerovioProvider>
      </div>

      <DownloadDialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        expression={piece}
      />
    </>
  )
}
