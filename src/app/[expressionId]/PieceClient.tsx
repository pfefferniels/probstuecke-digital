'use client'

import { type MouseEvent, useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NotatedMusic, OtherPrintContext } from '@/components/NotatedMusic'
import Ceteicean from '@/ceteicean/Ceteicean'
import { Behavior } from '@/ceteicean/Behavior'
import { Collapse, Grid, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import { Word } from '@/components/Word'
import { LineBreak } from '@/components/LineBreak'
import { VerovioProvider } from '@/hooks/useVerovio'
import { type View, ViewContext } from '@/hooks/useView'
import { Ref } from '@/components/Ref'
import { GlowDefs } from '@/components/GlowDefs'
import LinkToIndex from '@/components/LinkToIndex'
import TermLink from '@/components/TermLink'
import { Download, InfoOutlined, Subtitles, SubtitlesOff } from '@mui/icons-material'
import { DownloadDialog } from '@/components/DownloadDialog'
import { SourcePanel } from '@/components/SourcePanel'
import { InterlinearOriginal } from '@/components/InterlinearOriginal'
import { lessonRoutes, Participants } from '@/components/Lesson'
import { keyLabel, longLabel, shortLabel, versionLabel } from '@/lib/expressionLabels'
import type { EditionVersion, Expression, ExpressionZone, TermSummary, WorkExpression } from '@/lib/types'

// The section (§) being read: the last one that begins above the upper third of the screen.
// None at the top of the page, which shows the title and the score first.
const sectionInView = () => {
  if (window.scrollY === 0) return null
  let current: string | null = null
  for (const section of Array.from(document.querySelectorAll('[id^="section-"]'))) {
    if (section.getBoundingClientRect().top > window.innerHeight / 3) break
    current = section.id
  }
  return current
}

const views: { value: View, label: string, description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Modern spelling, clefs and accidentals' },
  { value: 'diplomatic', label: 'Diplomatic', description: 'As printed: spelling, characters and line breaks, clefs and accidentals' },
]

interface PieceClientProps {
  piece: Expression
  version: EditionVersion
  terms: Record<string, TermSummary>
}

export default function PieceClient({ piece, version, terms }: PieceClientProps) {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const router = useRouter()
  const context = piece.context

  // Another version opens at the section being read, if it has as many sections; versions
  // divided differently (often 1719 and 1731) do not correspond section by section
  const openVersion = (event: MouseEvent<HTMLAnchorElement>, sibling: WorkExpression) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (!context || sibling.sections !== context.expression.sections) return
    const section = sectionInView()
    if (!section) return
    event.preventDefault()
    router.push(`/${sibling.referringTo[0]}/#${section}`)
  }

  // a translation aligned with its original shows the original between its lines, a
  // print where the other print differs, in the text and in the music, unless the reader
  // has hidden it (remembered in this browser, for translations and prints apart)
  const [showOriginal, setShowOriginal] = useState(true)
  const textRef = useRef<HTMLDivElement>(null)
  const alignedWith = context?.siblings.find((sibling) => sibling.referringTo.includes(piece.original?.expressionId || ''))
  const otherEdition = context?.expression.type === 'edition'
    ? context.siblings.find((sibling) => sibling.type === 'edition' && !sibling.referringTo.includes(piece.expressionId || ''))
    : undefined
  const otherPrintId = otherEdition?.referringTo[0]
  const otherPrintLabel = otherEdition && shortLabel(otherEdition)
  const otherPrint = useMemo(
    () => otherPrintId && otherPrintLabel ? { id: otherPrintId, label: otherPrintLabel } : undefined,
    [otherPrintId, otherPrintLabel]
  )
  const originalName = otherPrint
    ? `differences from ${otherPrint.label}`
    : alignedWith ? `${shortLabel(alignedWith)} text` : 'original'
  const storageKey = context?.expression.type === 'edition' ? 'hideOtherPrint' : 'hideOriginal'

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === 'true') setShowOriginal(false)
    } catch {
      // no storage: the original is shown
    }
  }, [storageKey])

  // modern or as printed, the text and the music alike; the choice holds for all pages
  // (remembered in this browser)
  const [view, setView] = useState<View>('modern')

  useEffect(() => {
    try {
      if (localStorage.getItem('view') === 'diplomatic') setView('diplomatic')
    } catch {
      // no storage: the modern view
    }
  }, [])

  const changeView = (next: View) => {
    try {
      localStorage.setItem('view', next)
    } catch {
      // no storage: the choice holds for this page only
    }
    setView(next)
  }

  // the scores show where the other print differs as well
  const printContext = useMemo(() => ({ otherPrint, differences: showOriginal }), [otherPrint, showOriginal])

  const toggleOriginal = () => {
    try {
      localStorage.setItem(storageKey, String(showOriginal))
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
    // the lines of a print
    ...(piece.isFraktur ? { 'tei-lb': LineBreak } : {}),
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
      // a section (from another version of the piece) is shown from its start; a passage is marked
      const section = id.startsWith('section-')
      const reveal = () => el.scrollIntoView({ block: section ? 'start' : 'center' })
      if (!section) el.classList.add('linkTarget')
      reveal()
      // the score is laid out after the text and may push the passage down
      later.push(window.setTimeout(reveal, 1500))
    }, 150)
    return () => {
      window.clearInterval(timer)
      later.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  return (
    <ViewContext.Provider value={view}>
      <div className="piece">
        <GlowDefs />

        <div className="title">
          <div className="pieceBar">
            <span className="workTitle">
              {context ? `${context.workTitle} · ${keyLabel(context.key)}` : piece.header.title}
            </span>
            {context && context.siblings.length > 1 && (
              <nav className="versions" aria-label="Versions of this piece">
                {context.siblings.map(sibling => sibling.referringTo.includes(piece.expressionId || '')
                  ? (
                    <span key={sibling.id} className="version" aria-current="page" title={longLabel(sibling)}>
                      {versionLabel(sibling)}
                    </span>
                  )
                  : (
                    <Link
                      key={sibling.id}
                      className="version"
                      href={`/${sibling.referringTo[0]}/`}
                      title={longLabel(sibling)}
                      onClick={event => openVersion(event, sibling)}
                    >
                      {versionLabel(sibling)}
                    </Link>
                  ))}
              </nav>
            )}
            {context && context.siblings.length <= 1 && <span className="layer">{longLabel(context.expression)}</span>}
            {piece.diplomatic && (
              <ToggleButtonGroup
                className="viewSwitch"
                exclusive
                size="small"
                value={view}
                onChange={(_, next: View | null) => next && changeView(next)}
                aria-label="How the text and the music are shown"
              >
                {views.map(({ value, label, description }) => (
                  <Tooltip key={value} title={description} describeChild>
                    <ToggleButton value={value}>{label}</ToggleButton>
                  </Tooltip>
                ))}
              </ToggleButtonGroup>
            )}
            <span className="actions">
              {(piece.original || otherPrint) && (
                <Tooltip title={showOriginal ? `Hide the ${originalName}` : `Show the ${originalName}${otherPrint ? '' : ' between the lines'}`}>
                  <IconButton
                    color="primary"
                    aria-label={otherPrint ? `The ${originalName}` : `The ${originalName} between the lines`}
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

        <OtherPrintContext.Provider value={printContext}>
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
                className={[piece.score ? '' : 'textOnly', piece.original && showOriginal ? 'interlinear' : '', piece.original?.differences && showOriginal ? 'differences' : ''].join(' ').trim() || undefined}
              >
                {piece.header.participants.length > 0 && <Participants participants={piece.header.participants} />}
                <div ref={textRef} className={piece.original ? 'interlinearText' : undefined}>
                  {piece.text && <Ceteicean pageContext={piece.text as any} routes={routes} />}
                  {piece.original && showOriginal && <InterlinearOriginal container={textRef} />}
                </div>
              </Grid>
            </Grid>
          </VerovioProvider>
        </OtherPrintContext.Provider>
      </div>

      <DownloadDialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        expression={piece}
      />
    </ViewContext.Provider>
  )
}
