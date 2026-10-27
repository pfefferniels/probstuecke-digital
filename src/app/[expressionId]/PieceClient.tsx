'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { NotatedMusic } from '@/components/NotatedMusic'
import Ceteicean from '@/ceteicean/Ceteicean'
import { Behavior } from '@/ceteicean/Behavior'
import { Collapse, Grid, IconButton, Tooltip } from '@mui/material'
import { Word } from '@/components/Word'
import { VerovioProvider } from '@/hooks/useVerovio'
import { Ref } from '@/components/Ref'
import { GlowDefs } from '@/components/GlowDefs'
import LinkToIndex from '@/components/LinkToIndex'
import { Download, InfoOutlined } from '@mui/icons-material'
import { DownloadDialog } from '@/components/DownloadDialog'
import { SourcePanel } from '@/components/SourcePanel'
import { keyLabel, longLabel, shortLabel } from '@/lib/expressionLabels'
import type { EditionVersion, Expression, ExpressionZone } from '@/lib/types'

interface PieceClientProps {
  piece: Expression
  version: EditionVersion
}

export default function PieceClient({ piece, version }: PieceClientProps) {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const context = piece.context

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

        <div className="title">
          <div className="pieceBar">
            <span className="workTitle">
              {context ? `${context.workTitle} · ${keyLabel(context.key)}` : piece.header.title}
            </span>
            {context && <span className="layer">{longLabel(context.expression)}</span>}
            {context && context.siblings.length > 1 && (
              <nav className="versions" aria-label="Versions of this piece">
                {context.siblings.map((sibling, i) => (
                  <Fragment key={sibling.id}>
                    {i > 0 && <span className="sep">·</span>}
                    {sibling.referringTo.includes(piece.expressionId || '')
                      ? <strong aria-current="page">{shortLabel(sibling)}</strong>
                      : <Link href={`/${sibling.referringTo[0]}/`} title={longLabel(sibling)}>{shortLabel(sibling)}</Link>}
                  </Fragment>
                ))}
              </nav>
            )}
            <span className="actions">
              <Tooltip title="About this text">
                <IconButton
                  color="primary"
                  aria-label="About this text"
                  aria-expanded={sourceOpen}
                  onClick={() => setSourceOpen(!sourceOpen)}
                >
                  <InfoOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton color="primary" aria-label="Download" onClick={() => setDownloadDialogOpen(true)}>
                  <Download />
                </IconButton>
              </Tooltip>
            </span>
          </div>

          <h2 lang={piece.lang}>
            {piece.title
              ? (
                <Ceteicean
                  pageContext={piece.title as any}
                  routes={{
                    'tei-w': Word,
                  }}
                />
              )
              : piece.header.title}
          </h2>
        </div>

        <Collapse in={sourceOpen}>
          <SourcePanel expression={piece} version={version} />
        </Collapse>

        <VerovioProvider>
          {/* side by side from the md breakpoint on; below it the score comes first and the commentary follows */}
          <Grid container spacing={1} lang={piece.lang}>
            {piece.score && (
              <Grid size={{ xs: 12, md: 6 }} className="scoreView">
                <Ceteicean pageContext={piece.score as any} routes={routes} />
              </Grid>
            )}
            <Grid size={piece.score ? { xs: 12, md: 6 } : 12} p={1.5} className={piece.score ? undefined : 'textOnly'}>
              {piece.text && <Ceteicean pageContext={piece.text as any} routes={routes} />}
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
