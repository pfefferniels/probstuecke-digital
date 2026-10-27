'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
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
import TermLink from '@/components/TermLink'
import { Download, InfoOutlined, Subtitles, SubtitlesOff } from '@mui/icons-material'
import { DownloadDialog } from '@/components/DownloadDialog'
import { SourcePanel } from '@/components/SourcePanel'
import { InterlinearOriginal } from '@/components/InterlinearOriginal'
import { lessonRoutes, Participants } from '@/components/Lesson'
import { keyLabel, longLabel, shortLabel } from '@/lib/expressionLabels'
import type { EditionVersion, Expression, ExpressionZone, TermSummary } from '@/lib/types'

interface PieceClientProps {
  piece: Expression
  version: EditionVersion
  terms: Record<string, TermSummary>
}

export default function PieceClient({ piece, version, terms }: PieceClientProps) {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  // a translation aligned with its original shows the original between its lines,
  // unless the reader has hidden it (remembered in this browser)
  const [showOriginal, setShowOriginal] = useState(true)
  const textRef = useRef<HTMLDivElement>(null)
  const context = piece.context

  useEffect(() => {
    try {
      if (localStorage.getItem('hideOriginal') === 'true') setShowOriginal(false)
    } catch {
      // no storage: the original is shown
    }
  }, [])

  const toggleOriginal = () => {
    try {
      localStorage.setItem('hideOriginal', String(showOriginal))
    } catch {
      // no storage: the choice holds for this page only
    }
    setShowOriginal(!showOriginal)
  }

  const renderMusic = (teiNode: Element) => (
    <NotatedMusic
      teiNode={teiNode}
      meis={piece.mei || []}
      zones={(piece.zones?.filter(zone => !!zone) || []) as ExpressionZone[]}
      refs={piece.refTargets || []}
      expressionId={piece.expressionId || undefined}
    />
  )

  const routes = {
    'tei-notatedmusic': (node: any) => (
      <Behavior node={node}>
        {renderMusic(node.teiNode)}
      </Behavior>
    ),
    // lessons and realisations: speakers, actions, transcriptions and recordings
    ...lessonRoutes({ participants: piece.header.participants, media: piece.media, renderMusic }),
    'tei-w': Word,
    'tei-ref': Ref,
    'tei-persname': (props: any) => <LinkToIndex type="persons" {...props} />,
    'tei-name': (props: any) => <LinkToIndex type="musicalworks" {...props} />,
    'tei-bibl': (props: any) => <LinkToIndex type="bibliography" {...props} />,
    'tei-term': (props: any) => <TermLink terms={terms} {...props} />,
  }

  // the text is rendered in the browser, so a link to a place in it (e.g. from an index)
  // only finds its target once it is there
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    let tries = 0
    const later: number[] = []
    const timer = window.setInterval(() => {
      const el = document.getElementById(id)
      if (el || ++tries > 40) window.clearInterval(timer)
      if (!el) return
      el.classList.add('linkTarget')
      el.scrollIntoView({ block: 'center' })
      // the score is laid out after the text and may push the passage down
      later.push(window.setTimeout(() => el.scrollIntoView({ block: 'center' }), 1500))
    }, 150)
    return () => {
      window.clearInterval(timer)
      later.forEach((t) => window.clearTimeout(t))
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
              {piece.original && (
                <Tooltip title={showOriginal ? 'Hide the original' : 'Show the original between the lines'}>
                  <IconButton
                    color="primary"
                    aria-label="Original between the lines"
                    aria-pressed={showOriginal}
                    onClick={toggleOriginal}
                  >
                    {showOriginal ? <Subtitles /> : <SubtitlesOff />}
                  </IconButton>
                </Tooltip>
              )}
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
            <Grid
              size={piece.score ? { xs: 12, md: 6 } : 12}
              p={1.5}
              className={[piece.score ? '' : 'textOnly', piece.original && showOriginal ? 'interlinear' : ''].join(' ').trim() || undefined}
            >
              {piece.header.participants.length > 0 && <Participants participants={piece.header.participants} />}
              <div ref={textRef} className={piece.original ? 'interlinearText' : undefined}>
                {piece.text && <Ceteicean pageContext={piece.text as any} routes={routes} />}
                {piece.original && showOriginal && <InterlinearOriginal container={textRef} />}
              </div>
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
