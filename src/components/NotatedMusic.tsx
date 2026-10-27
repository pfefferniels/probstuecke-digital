'use client'

import { type MouseEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useVerovio } from '../hooks/useVerovio';
import { Stack, Pagination, ToggleButton, ToggleButtonGroup, ToggleButtonProps, Button, ButtonProps, Tooltip, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { addEmptyStaves } from '../helpers/addEmptyStaves';
import { removeEmbeddedAnnotations } from '../helpers/removeEmbeddedAnnotations';
import { smuflFigures } from '../helpers/smuflFigures';
import { dropHiddenAccidentals } from '../helpers/dropHiddenAccidentals';
import { showPieceBarNumbers } from '../helpers/showPieceBarNumbers';
import { clearTouchSelection, isTouchInput, revealElement, selectLink } from '../helpers/touchSelection';
import { mdivLabel, mdivXPathQuery, topLevelMdivs } from '../helpers/mdivs';
import { readingsXPathQuery } from '../helpers/readings';
import './NotatedMusic.css'
import type { ExpressionMei, ExpressionZone } from '@/lib/types'


const OptionToggle = ({ label, ...props }: ToggleButtonProps & { label: string }) => {
    return (
        <Tooltip title={label}>
        <ToggleButton
            aria-label={label}
            sx={{
                border: 0,
                fontWeight: 700,
                fontSize: '1.5rem',
                font: 'Roboto,sans-serif',
                padding: '0.4rem',
                lineHeight: 1
            }}
            {...props}
        >
            {props.children}
        </ToggleButton>
        </Tooltip>
    );
}

const OptionButton = ({ label, ...props }: ButtonProps & { label: string }) => {
    return (
        <Tooltip title={label}>
        <Button
            aria-label={label}
            sx={{
                border: 0,
                fontWeight: 700,
                fontSize: '1.5rem',
                font: 'Roboto,sans-serif',
                padding: '0.4rem',
                lineHeight: 1,
                minWidth: 'inherit',
                color: 'rgba(0, 0, 0, 0.54)'
            }}
            {...props}
        >
            {props.children}
        </Button>
        </Tooltip>
    );
}

// Verovio lays the music out on a page 2100 units wide, drawn 630 px wide at scale 30
// and then fitted to the width of the container. A much narrower container (on a phone
// or tablet) gets a narrower page instead, with fewer bars to a system, so that the
// music keeps its size.
const scale = 30
const fullPageWidth = 2100

const pageWidthFor = (containerWidth: number) => {
    const units = containerWidth * 100 / scale
    // shrinking the full page a little is fine
    if (units >= fullPageWidth * 0.8) return fullPageWidth
    // in steps of 100 units, so that small changes in width do not lay the music out again
    return Math.max(600, Math.floor(units / 100) * 100)
}

// pointing within this many pixels of a referenced score element counts as pointing at it
const proximityPadding = 15

// The referenced score element nearest to a point inside the container, if any is close enough
const nearestReferenced = (container: Element, x: number, y: number) => {
    let nearest: Element | null = null
    let nearestDistance = proximityPadding
    for (const el of Array.from(container.querySelectorAll('[data-referenced]'))) {
        const rect = el.getBoundingClientRect()
        const distance = Math.hypot(
            Math.max(rect.left - x, 0, x - rect.right),
            Math.max(rect.top - y, 0, y - rect.bottom)
        )
        if (distance <= nearestDistance) {
            nearest = el
            nearestDistance = distance
        }
    }
    return nearest
}

interface Highlight {
    ids: string[]
    // scroll to the first element once it is drawn
    reveal: boolean
}

// Highlights the score elements that are drawn, and scrolls to the first one if asked to
const applyHighlight = (highlight: Highlight) => {
    const elements = highlight.ids
        .map(id => document.getElementById(id))
        .filter(el => !!el)
    elements.forEach(el => el.setAttribute('filter', 'url(#highlightGlow)'))
    if (highlight.reveal && elements.length > 0) {
        revealElement(elements[0])
        highlight.reveal = false
    }
}

interface Facsimile {
    // the staff tapped
    staffId: string
    imageUrls: string[]
    // position below the staff, relative to the score
    top: number
}

if (typeof window !== 'undefined') {
    window.highlightRefs = window.highlightRefs || ((_: string[]) => () => { });
    window.scoreSettings = window.scoreSettings || {
        modernClefs: false,
        rightHand: false,
        emptyStaves: 0,
        mdiv: 0
    }
}

interface NotatedMusicProps {
    teiNode: Element,
    meis: readonly (ExpressionMei | null)[]
    zones: readonly (ExpressionZone | null)[]
    refs: readonly (string | null)[]
    expressionId?: string
}

export const NotatedMusic = ({ teiNode, meis, refs, zones, expressionId }: NotatedMusicProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [svgs, setSVGs] = useState<string[]>([])
    const [modernClefs, setModernClefs] = useState(false)
    const [rightHand, setRightHand] = useState(false)
    const [emptyStaves, setEmptyStaves] = useState(0)
    const [renderFailed, setRenderFailed] = useState(false)
    // whether the encoding has modern clefs, figures or accidentals to switch to
    const [canModernise, setCanModernise] = useState(false)
    // whether the score has a staff with Mattheson's right hand (realisations have their own)
    const [hasRightHandStaff, setHasRightHandStaff] = useState(false)
    const [pageWidth, setPageWidth] = useState<number | null>(null)
    // on touch screens: the part of the page image shown for a tapped staff
    const [facsimile, setFacsimile] = useState<Facsimile | null>(null)
    // the labels of the <mdiv>s, if the score has the piece more than once (e.g. in another key)
    const [mdivLabels, setMdivLabels] = useState<string[]>([])
    // the <mdiv> to draw (also as a ref, for highlightRefs), and the one drawn
    const [mdivIndex, setMdivIndex] = useState(0)
    const selectedMdiv = useRef(0)
    const shownMdiv = useRef(0)
    // the <mdiv> each element of the encoding belongs to
    const mdivOf = useRef(new Map<string, number>())
    const containerRef = useRef<HTMLDivElement>(null)
    const highlighted = useRef<Highlight>({ ids: [], reveal: false })
    const shownPage = useRef(1)

    // a notatedMusic, or in lessons a ptr[@type="transcription"] (see collectEmbeddedMEI)
    const ptr = teiNode.tagName.toLowerCase() === 'tei-ptr' ? teiNode : teiNode.querySelector('tei-ptr')
    const teiId = teiNode.getAttribute('id')
        || ptr?.getAttribute('target')?.replace('.xml', '');
    const isMainScore = teiId === 'score'
    const mei = meis.find(mei => mei?.xmlId === teiId)?.mei

    const { vrvToolkit } = useVerovio()

    // the PDF export follows what the main score shows
    useEffect(() => {
        if (!isMainScore) return
        window.scoreSettings = {
            modernClefs,
            rightHand,
            emptyStaves,
            mdiv: mdivIndex
        }
    }, [isMainScore, modernClefs, rightHand, emptyStaves, mdivIndex])

    useEffect(() => {
        if (!mei) return
        const mdivs = topLevelMdivs(new DOMParser().parseFromString(mei, 'application/xml'))
        const ids = new Map<string, number>()
        mdivs.forEach((mdiv, i) => {
            for (const el of Array.from(mdiv.querySelectorAll('*'))) {
                const id = el.getAttribute('xml:id')
                if (id) ids.set(id, i)
            }
        })
        mdivOf.current = ids
        setMdivLabels(mdivs.map(mdivLabel))
    }, [mei])

    const selectMdiv = (index: number) => {
        selectedMdiv.current = index
        setMdivIndex(index)
    }

    useEffect(() => {
        if (!isMainScore) return

        window.highlightRefs = (refs: string[], reveal = false) => {
            if (!vrvToolkit) return () => { }

            const highlight = { ids: refs, reveal }
            highlighted.current = highlight

            const dehighlight = () => {
                if (highlighted.current === highlight) highlighted.current = { ids: [], reveal: false }
                for (const ref of refs) {
                    document.getElementById(ref)?.setAttribute('filter', 'url(#softGlow)')
                }
            }

            // the elements may belong to another <mdiv>: draw it, then turn to
            // the page with them; they are highlighted once it is drawn
            const mdiv = refs
                .map(ref => mdivOf.current.get(ref))
                .find(mdiv => mdiv !== undefined)
            if (mdiv !== undefined && mdiv !== selectedMdiv.current) {
                selectMdiv(mdiv)
                return dehighlight
            }

            const page = refs
                .map(ref => vrvToolkit.getPageWithElement(ref) as number)
                .find(page => page > 0)
            if (page && page !== shownPage.current) setCurrentPage(page)
            else applyHighlight(highlight)

            return dehighlight
        }
    }, [vrvToolkit, isMainScore])

    // the parts of the page image that a staff was transcribed from
    const facsimileUrls = (staff: Element) => (staff.getAttribute('data-facs')?.split(' ') || [])
        .map(zoneLink => zones.find(zone => zone?.xmlId === zoneLink.slice(1))?.imageApiUrl)
        .filter((url): url is string => !!url)

    // lay the music out again when the width of the container changes
    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width > 0) setPageWidth(pageWidthFor(entry.contentRect.width))
        })
        observer.observe(container)
        return () => observer.disconnect()
    }, [])

    // a new page or layout: keep the highlight, and close the page image, which belongs to the old one
    useLayoutEffect(() => {
        shownPage.current = currentPage
        applyHighlight(highlighted.current)
        setFacsimile(null)
    }, [currentPage, svgs])

    useEffect(() => {
        if (!vrvToolkit || !pageWidth) return

        if (!mei) return

        const meiDoc = new DOMParser().parseFromString(mei, 'application/xml')

        // in each <app>, the reading of the source this page is about
        const readings = readingsXPathQuery(meiDoc, expressionId)
        // the piece may be in the score more than once (e.g. in another key)
        const mdivCount = topLevelMdivs(meiDoc).length
        const mdiv = mdivIndex < mdivCount ? mdivIndex : 0

        setCanModernise(!!meiDoc.querySelector('choice, orig accid, supplied accid'))

        const hasEmbeddedAnnotation = !!meiDoc.querySelector('staffDef[type="embeddedAnnotation"]')
        setHasRightHandStaff(hasEmbeddedAnnotation)
        if (isMainScore && !rightHand && hasEmbeddedAnnotation) removeEmbeddedAnnotations(meiDoc)
        if (!isMainScore) showPieceBarNumbers(meiDoc)
        addEmptyStaves(meiDoc, emptyStaves)
        smuflFigures(meiDoc)
        dropHiddenAccidentals(meiDoc, modernClefs)

        const options: any = {
            scale,
            pageWidth,
            footer: modernClefs ? 'auto' : 'none',
            pageHeight: 2000,
            adjustPageHeight: true,
            svgViewBox: true,
            header: 'none',
            choiceXPathQuery: [modernClefs ? './reg' : './orig'],
            svgAdditionalAttribute: ['staff@facs']
        }

        if (readings) options.appXPathQuery = readings
        if (mdivCount > 1) options.mdivXPathQuery = mdivXPathQuery(mdiv)

        vrvToolkit.setOptions(options)

        // the page of each element of the drawn <mdiv> that is referenced from the text
        const pageOf = (ids: string[]) => ids
            .filter(id => mdivOf.current.get(id) === mdiv)
            .map(id => [id, vrvToolkit.getPageWithElement(id) as number] as const)

        const svgs = []
        let referenced: (readonly [string, number])[] = []
        try {
            vrvToolkit.loadData(new XMLSerializer().serializeToString(meiDoc));

            referenced = pageOf(refs.flatMap(ref => ref?.split(' ').map(target => target.slice(1)) || []))
            for (let i = 0; i < vrvToolkit.getPageCount(); i++) {
                // draw refs on the current page into the SVG
                const currentSVG = new DOMParser().parseFromString(vrvToolkit.renderToSVG(i + 1), 'image/svg+xml')
                referenced
                    .filter(([, page]) => page === i + 1)
                    .forEach(([id]) => {
                        const correspEl = currentSVG.getElementById(id)
                        if (!correspEl) return
                        correspEl.setAttribute('filter', 'url(#softGlow)')
                        correspEl.setAttribute('data-referenced', 'true')
                    })
                svgs.push(new XMLSerializer().serializeToString(currentSVG))
            }
        }
        catch {
            // Verovio aborts on some invalid encodings; this must not take down the whole page
            setRenderFailed(true)
            return
        }

        // another <mdiv>: show the page with the highlighted elements, or the first
        if (mdiv !== shownMdiv.current) {
            shownMdiv.current = mdiv
            const page = pageOf(highlighted.current.ids).map(([, page]) => page).find(page => page > 0)
            setCurrentPage(page || 1)
        }
        setRenderFailed(false)
        setSVGs(svgs)
    }, [vrvToolkit, mei, expressionId, isMainScore, modernClefs, rightHand, emptyStaves, refs, pageWidth, mdivIndex])

    useLayoutEffect(() => {
        const cleanups: (() => void)[] = []

        // Highlight references using proximity detection (no extra SVG elements)
        const refDataMap = new Map<Element, { meiId: string, corresps: NodeListOf<Element> }>()

        document
            .querySelectorAll('[data-referenced]')
            .forEach(ref => {
                const meiId = ref.getAttribute('id')
                if (!meiId) return
                const corresps = document.querySelectorAll(`[data-target~="#${meiId}"]`)
                refDataMap.set(ref, { meiId, corresps })
            })

        let currentHoveredRef: Element | null = null
        let currentDehighlight: (() => void) | undefined

        // mouse (or pen) only: on touch screens, taps are handled by onTap
        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return

            let closestRef: Element | null = null

            for (const [ref] of refDataMap) {
                const rect = (ref as SVGGraphicsElement).getBoundingClientRect()
                if (
                    e.clientX >= rect.left - proximityPadding &&
                    e.clientX <= rect.right + proximityPadding &&
                    e.clientY >= rect.top - proximityPadding &&
                    e.clientY <= rect.bottom + proximityPadding
                ) {
                    closestRef = ref
                    break
                }
            }

            if (closestRef === currentHoveredRef) return

            // Dehighlight previous
            if (currentHoveredRef) {
                const data = refDataMap.get(currentHoveredRef)
                if (data) {
                    data.corresps.forEach(corresp => {
                        (corresp as HTMLElement).classList.remove('highlight')
                    })
                }
                if (currentDehighlight) currentDehighlight()
            }

            currentHoveredRef = closestRef

            // Highlight new
            if (closestRef) {
                const data = refDataMap.get(closestRef)!
                data.corresps.forEach(corresp => {
                    (corresp as HTMLElement).classList.add('highlight')
                })
                currentDehighlight = window.highlightRefs([data.meiId])
                // scrolling to a passage that is already visible would move the score
                // away from the pointer (and close the page image)
                if (data.corresps.length > 0) revealElement(data.corresps[0])
            }
        }

        document.addEventListener('pointermove', onPointerMove)
        cleanups.push(() => {
            document.removeEventListener('pointermove', onPointerMove)
            if (currentHoveredRef) {
                const data = refDataMap.get(currentHoveredRef)
                if (data) {
                    data.corresps.forEach(corresp => {
                        (corresp as HTMLElement).classList.remove('highlight')
                    })
                }
                if (currentDehighlight) currentDehighlight()
            }
        })

        // Show facsimile on mouseover (mouse or pen; on touch screens see onTap)
        let removeTimer: ReturnType<typeof setTimeout> | null = null

        const cancelRemoveTimer = () => {
            if (removeTimer) {
                clearTimeout(removeTimer)
                removeTimer = null
            }
        }

        const scheduleRemovePreview = () => {
            cancelRemoveTimer()
            removeTimer = setTimeout(() => {
                document.querySelectorAll('.zone-preview').forEach(preview => preview.remove())
                removeTimer = null
            }, 300)
        }

        document
            .querySelectorAll<SVGGElement>('.staff[data-facs]')
            .forEach(staff => {
                const onPointerOver = (e: PointerEvent) => {
                    if (e.pointerType === 'touch') return

                    // A referenced note or figure links to the commentary instead. A referenced
                    // bar contains the staff: it links to the commentary and shows the page image.
                    const referenced = (e.target as Element | null)?.closest('[data-referenced]')
                    if (referenced && staff.contains(referenced)) return

                    cancelRemoveTimer()
                    if (document.querySelector('.zone-preview')) return

                    const selectedZones = facsimileUrls(staff)

                    const bbox = (staff as SVGGraphicsElement).getBoundingClientRect();

                    const div = document.createElement('div');
                    div.classList.add('zone-preview');
                    div.style.position = 'fixed';
                    div.style.left = `${Math.max(bbox.left - 100, 0)}px`;
                    div.style.top = `${bbox.top - 100}px`;
                    document.body.appendChild(div);

                    div.addEventListener('mouseenter', cancelRemoveTimer)
                    div.addEventListener('mouseleave', scheduleRemovePreview)

                    selectedZones.forEach((zone) => {
                        const img = document.createElement('img');
                        img.src = zone;
                        div.appendChild(img);
                    });
                }

                const onPointerLeave = (e: PointerEvent) => {
                    if (e.pointerType === 'touch') return
                    scheduleRemovePreview()
                }

                staff.addEventListener('pointerover', onPointerOver)
                staff.addEventListener('pointerleave', onPointerLeave)
                cleanups.push(() => {
                    staff.removeEventListener('pointerover', onPointerOver)
                    staff.removeEventListener('pointerleave', onPointerLeave)
                })
            })

        cleanups.push(() => cancelRemoveTimer())

        return () => {
            cleanups.forEach(cleanup => cleanup())
        }
    })

    // Touch screens: a tap on (or near) a referenced element finds its passage in the
    // commentary; a tap on another part of a staff shows the page image it comes from.
    // A referenced bar covers its staves: tapping it again shows the page image.
    const onTap = (e: MouseEvent<HTMLDivElement>) => {
        if (!isTouchInput()) return
        if (!(e.target as Element).closest('.score-page')) return

        const referenced = nearestReferenced(e.currentTarget, e.clientX, e.clientY)
        if (referenced) {
            const passages = Array.from(document.querySelectorAll(`[data-target~="#${referenced.id}"]`))
            const selected = passages.some(passage => passage.classList.contains('highlight'))
            if (!(selected && referenced.querySelector('.staff'))) {
                setFacsimile(null)
                selectLink(passages, [referenced.id], 'text')
                return
            }
        }
        else {
            clearTouchSelection()
        }

        const staff = Array
            .from(e.currentTarget.querySelectorAll('.staff[data-facs]'))
            .find(staff => {
                const rect = staff.getBoundingClientRect()
                return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
            })
        // tapping the same staff again closes the image
        const imageUrls = staff && staff.id !== facsimile?.staffId ? facsimileUrls(staff) : []
        if (!staff || imageUrls.length === 0) {
            setFacsimile(null)
            return
        }

        const top = staff.getBoundingClientRect().bottom - e.currentTarget.getBoundingClientRect().top
        setFacsimile({ staffId: staff.id, imageUrls, top })
    }

    return (
        <div
            ref={containerRef}
            onClick={onTap}
            className={`score ${isMainScore ? 'main-score' : 'example-score'} ${modernClefs ? 'modernized' : 'diplomatic'}`}
        >
            {(isMainScore || canModernise) && (
            <div style={{
                float: isMainScore ? 'right' : 'left',
                border: '0.5px solid gray',
                borderRadius: '0.5rem'
            }}>
                {canModernise && (
                    <OptionToggle
                        value="check"
                        label={modernClefs ? 'Show the original notation' : 'Show modern clefs and accidentals'}
                        selected={modernClefs}
                        onChange={() => setModernClefs(!modernClefs)}
                    >
                        {modernClefs ? '\u{1D121}' : '\u{1D122}'}
                    </OptionToggle>
                )}

                {isMainScore && (
                    <>
                        {hasRightHandStaff && (
                        <OptionToggle
                            value="check"
                            label={rightHand ? 'Hide the right-hand staff' : 'Show the right-hand staff'}
                            selected={rightHand}
                            onChange={() => setRightHand(!rightHand)}
                        >
                            {'{}'}
                        </OptionToggle>
                        )}
                        <OptionButton label="Add an empty staff for a realisation" onClick={() => setEmptyStaves(emptyStaves + 1)}>
                            +
                        </OptionButton>
                        <OptionButton label="Remove an empty staff" onClick={() => setEmptyStaves(Math.max(emptyStaves - 1, 0))}>
                            -
                        </OptionButton>
                    </>
                )}
            </div>
            )}

            {isMainScore && mdivLabels.length > 1 && (
                <ToggleButtonGroup
                    exclusive
                    value={mdivIndex}
                    onChange={(_, index: number | null) => {
                        if (index === null) return
                        clearTouchSelection()
                        selectMdiv(index)
                    }}
                    aria-label="Notation of the piece"
                    sx={{
                        float: 'right',
                        marginRight: '0.5rem',
                        border: '0.5px solid gray',
                        borderRadius: '0.5rem',
                        '& .MuiToggleButton-root': {
                            border: 0,
                            fontWeight: 700,
                            fontSize: '1rem',
                            lineHeight: 1.5,
                            padding: '0.4rem 0.6rem',
                            textTransform: 'none'
                        }
                    }}
                >
                    {mdivLabels.map((label, i) => (
                        <ToggleButton key={i} value={i}>{label}</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            )}

            {renderFailed && (
                <p style={{ clear: 'both', color: 'gray', fontStyle: 'italic' }}>
                    This music could not be displayed.
                </p>
            )}
            <div className="score-page" dangerouslySetInnerHTML={{ __html: svgs[currentPage - 1] }} />

            {facsimile && (
                <div className="facsimile-popup" style={{ top: facsimile.top }}>
                    <div className="facsimile-popup-bar">
                        <span>Original print</span>
                        <IconButton size="small" aria-label="Close the page image" onClick={() => setFacsimile(null)}>
                            <Close fontSize="small" />
                        </IconButton>
                    </div>
                    <div className="facsimile-popup-images">
                        {facsimile.imageUrls.map(url => <img key={url} src={url} alt="This staff in the original print" />)}
                    </div>
                </div>
            )}

            {
                svgs.length > 1 && (
                    <Stack alignItems="center" sx={{ marginTop: '1rem' }}>
                        <Pagination count={svgs.length} page={currentPage} onChange={(_, value) => {
                            setCurrentPage(value)
                        }} />
                    </Stack>
                )
            }
        </div>
    )
}
