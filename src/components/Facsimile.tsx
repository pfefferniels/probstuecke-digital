'use client'

import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Pagination, PaginationItem, Stack } from '@mui/material'
import { revealElement } from '@/helpers/touchSelection'
import type { ExpressionFacsimile, FacsimilePage, FacsimileZone } from '@/lib/types'

/**
 * The facsimile view of a print: its score page by page, where the score stands on the
 * page with the transcription, and the pages of its text beside it, where the text stands
 * (helpers/collectors/collectFacsimile). Where the encodings mark the paragraphs and the
 * bars on the pages, pointing at a paragraph shows the bars it refers to, and pointing at
 * a bar the paragraphs that refer to it; on touch screens a tap does the same and brings
 * the other side into view.
 */

type Side = 'score' | 'text'

interface Active {
    key: string
    side: Side
    // chosen by a tap (or a click), which stays until the next one
    chosen: boolean
}

interface FacsimileState {
    facsimile: ExpressionFacsimile
    /** the bars a paragraph refers to, and the paragraphs that refer to a bar */
    linked: Map<string, string[]>
    active: Active | null
    point: (key: string, side: Side, chosen: boolean) => void
    leave: (key: string) => void
    scorePage: number
    setScorePage: (page: number) => void
}

const FacsimileContext = createContext<FacsimileState | null>(null)

const useFacsimile = () => {
    const state = useContext(FacsimileContext)
    if (!state) throw new Error('outside a FacsimileProvider')
    return state
}

// the zones of a paragraph or a bar on the page
const zonesOf = (key: string) => document.querySelectorAll(`.facsimileZone[data-key="${CSS.escape(key)}"]`)

const NONE: ExpressionFacsimile = { score: [], text: [], links: [] }

export const FacsimileProvider = ({ facsimile: given, children }: { facsimile: ExpressionFacsimile | null, children: ReactNode }) => {
    const facsimile = given ?? NONE
    const [active, setActive] = useState<Active | null>(null)
    const [scorePage, setScorePage] = useState(0)

    const linked = useMemo(() => {
        const linked = new Map<string, string[]>()
        const link = (from: string, to: string) => linked.set(from, [...(linked.get(from) || []), to])
        for (const [paragraph, bar] of facsimile.links) {
            link(paragraph, bar)
            link(bar, paragraph)
        }
        return linked
    }, [facsimile])

    const point = useCallback((key: string, side: Side, chosen: boolean) => {
        setActive({ key, side, chosen })
        const others = linked.get(key) || []
        if (side === 'text') {
            // the score turns to the page with the first bar
            const page = facsimile.score.findIndex(page => page.zones.some(zone => others.includes(zone.key)))
            if (page >= 0) setScorePage(page)
        }
        if (!chosen) return
        // once the page is shown, the first paragraph or bar is brought into view
        requestAnimationFrame(() => {
            const first = others.flatMap(other => Array.from(zonesOf(other))).find(zone => zone.getClientRects().length > 0)
            if (first) revealElement(first)
        })
    }, [facsimile, linked])

    const leave = useCallback((key: string) => {
        setActive(active => active && active.key === key && !active.chosen ? null : active)
    }, [])

    // a tap or a click anywhere else clears what was chosen
    useEffect(() => {
        if (!active?.chosen) return
        const clear = (e: PointerEvent) => {
            if (!(e.target as Element | null)?.closest('.facsimileZone')) setActive(null)
        }
        document.addEventListener('pointerup', clear)
        return () => document.removeEventListener('pointerup', clear)
    }, [active])

    const state = useMemo(
        () => ({ facsimile, linked, active, point, leave, scorePage, setScorePage }),
        [facsimile, linked, active, point, leave, scorePage]
    )
    return <FacsimileContext.Provider value={state}>{children}</FacsimileContext.Provider>
}

// the page image, as wide as needed; all of it is named "full" (else the server redirects there)
const WIDTHS = [600, 1000, 1500]
const imageUrl = ({ image, region, full }: FacsimilePage, width: number) =>
    `${image}/${full ? 'full' : `${region.x},${region.y},${region.w},${region.h}`}/${Math.min(width, region.w)},/0/default.jpg`

const percent = (value: number) => `${(value * 100).toFixed(3)}%`

interface PageProps {
    page: FacsimilePage
    side: Side
    /** the description of the page for those who cannot see it */
    alt: string
    /** e.g. a height that the page must not exceed */
    width?: string
    /** a page of the score not shown, loaded for when it is turned to */
    hidden?: boolean
}

const Page = ({ page, side, alt, width, hidden }: PageProps) => {
    const { linked, active, point, leave } = useFacsimile()
    const { region } = page
    const shown = active ? [active.key, ...(linked.get(active.key) || [])] : []

    const zone = (z: FacsimileZone, i: number) => {
        const links = linked.has(z.key)
        // within the part of the page shown
        const top = Math.max(z.y, region.y)
        const bottom = Math.min(z.y + z.h, region.y + region.h)
        return (
            <span
                key={i}
                data-key={z.key}
                className={[
                    'facsimileZone',
                    side,
                    links ? 'linked' : '',
                    shown.includes(z.key) ? 'active' : '',
                ].join(' ')}
                style={{
                    left: percent((z.x - region.x) / region.w),
                    top: percent((top - region.y) / region.h),
                    width: percent(z.w / region.w),
                    height: percent((bottom - top) / region.h),
                }}
                onPointerEnter={links ? e => { if (e.pointerType === 'mouse') point(z.key, side, false) } : undefined}
                onPointerLeave={links ? e => { if (e.pointerType === 'mouse') leave(z.key) } : undefined}
                onClick={links ? () => point(z.key, side, true) : undefined}
            />
        )
    }

    return (
        <figure className="facsimilePage" hidden={hidden}>
            {page.n && <figcaption>p. {page.n}</figcaption>}
            <div className="facsimileImage" style={{ aspectRatio: `${region.w} / ${region.h}`, width }}>
                <img
                    src={imageUrl(page, 1000)}
                    srcSet={WIDTHS.map(w => `${imageUrl(page, w)} ${Math.min(w, region.w)}w`).join(', ')}
                    sizes="(min-width: 900px) 50vw, 100vw"
                    alt={alt}
                    loading={side === 'score' ? 'eager' : 'lazy'}
                    decoding="async"
                />
                {page.zones.map(zone)}
                {/* where a section (§) begins, for links to it and for the other versions of the piece */}
                {page.sections.map(section => (
                    <span key={section.id} id={section.id} className="facsimileSection" style={{ top: percent((section.y - region.y) / region.h) }} />
                ))}
            </div>
        </figure>
    )
}

const describe = (page: FacsimilePage, what: string, print: string) =>
    `${page.n ? `Page ${page.n}` : 'A page'} of the ${print} print${what}`

/** The score, page by page, as large as the screen allows; the other pages load in the background */
export const ScoreFacsimile = ({ print }: { print: string }) => {
    const { facsimile, linked, active, scorePage, setScorePage } = useFacsimile()
    const pages = facsimile.score
    const shown = Math.min(scorePage, pages.length - 1)
    // the pages with bars that light up, marked in the pagination
    const keys = active ? [active.key, ...(linked.get(active.key) || [])] : []
    const lit = new Set(pages.flatMap((page, i) => page.zones.some(zone => keys.includes(zone.key)) ? [i] : []))

    return (
        <div className="main-score facsimileScore">
            {pages.map((page, i) => (
                <Page
                    key={i}
                    page={page}
                    side="score"
                    hidden={i !== shown}
                    alt={describe(page, ', with the score', print)}
                    width={`min(100%, calc((100vh - var(--title-height, 0px) - 6rem) * ${(page.region.w / page.region.h).toFixed(4)}))`}
                />
            ))}
            {pages.length > 1 && (
                <Stack alignItems="center" sx={{ marginTop: '0.5rem' }}>
                    <Pagination
                        count={pages.length}
                        page={shown + 1}
                        onChange={(_, value) => setScorePage(value - 1)}
                        renderItem={item => (
                            <PaginationItem
                                {...item}
                                className={item.type === 'page' && item.page && lit.has(item.page - 1) ? 'lit' : undefined}
                            />
                        )}
                    />
                </Stack>
            )}
        </div>
    )
}

/** The pages of the text, one below the other */
export const TextFacsimile = ({ print, credit }: { print: string, credit?: ReactNode }) => {
    const { facsimile } = useFacsimile()
    return (
        <div className="facsimileText">
            {facsimile.text.map((page, i) => (
                <Page key={i} page={page} side="text" alt={describe(page, '', print)} />
            ))}
            {credit && <p className="facsimileCredit">{credit}</p>}
        </div>
    )
}
