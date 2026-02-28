'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { useVerovio } from '../hooks/useVerovio';
import { Stack, Pagination, ToggleButton, ToggleButtonProps, Button, ButtonProps } from '@mui/material';
import { addEmptyStaves } from '../helpers/addEmptyStaves';
import { removeEmbeddedAnnotations } from '../helpers/removeEmbeddedAnnotations';
import './NotatedMusic.css'
import type { ExpressionMei, ExpressionZone } from '@/lib/types'


const OptionToggle = (props: ToggleButtonProps) => {
    return (
        <ToggleButton
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
    );
}

const OptionButton = (props: ButtonProps) => {
    return (
        <Button
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
    );
}

if (typeof window !== 'undefined') {
    window.highlightRefs = window.highlightRefs || ((_: string[]) => () => { });
    window.scoreSettings = window.scoreSettings || {
        modernClefs: false,
        rightHand: false,
        emptyStaves: 0
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

    const teiId = teiNode.getAttribute('id')
        || teiNode.querySelector('tei-ptr')?.getAttribute('target')?.replace('.xml', '');
    const isMainScore = teiId === 'score'

    const { vrvToolkit } = useVerovio()

    useEffect(() => {
        window.scoreSettings = {
            modernClefs,
            rightHand,
            emptyStaves
        }
    }, [modernClefs, rightHand, emptyStaves])

    useEffect(() => {
        if (!isMainScore) return

        window.highlightRefs = (refs: string[]) => {
            if (!vrvToolkit) return () => { }

            for (const ref of refs) {
                const pageWithRef = vrvToolkit.getPageWithElement(ref)
                setCurrentPage(pageWithRef)
                document.querySelector(`#${ref}`)?.setAttribute('filter', 'url(#highlightGlow)')
            }

            return () => {
                for (const ref of refs) {
                    document.querySelector(`#${ref}`)?.setAttribute('filter', 'url(#softGlow)')
                }
            }
        }
    }, [vrvToolkit])

    useEffect(() => {
        if (!vrvToolkit) return

        const corresp = meis.find(mei => mei?.xmlId === teiId)
        if (!corresp || !corresp.mei) return

        let mei = corresp.mei
        const meiDoc = new DOMParser().parseFromString(mei, 'application/xml')

        const sourceId = meiDoc
            .querySelector(`source[corresp="${expressionId}"]`)?.getAttribute('xml:id')

        const hasEmbeddedAnnotation = !!meiDoc.querySelector('staffDef[type="embeddedAnnotation"]')
        if (isMainScore && !rightHand && hasEmbeddedAnnotation) removeEmbeddedAnnotations(meiDoc)
        addEmptyStaves(meiDoc, emptyStaves)

        mei = new XMLSerializer().serializeToString(meiDoc)

        const options: any = {
            scale: 30,
            footer: modernClefs ? 'auto' : 'none',
            pageHeight: 2000,
            adjustPageHeight: true,
            svgViewBox: true,
            header: 'none',
            choiceXPathQuery: [modernClefs ? './reg' : './orig'],
            svgAdditionalAttribute: ['staff@facs']
        }

        if (sourceId) {
            options.appXPathQuery = `./*[source="${sourceId}"]`
        }

        vrvToolkit.setOptions(options)
        vrvToolkit.loadData(mei);

        const svgs = []
        for (let i = 0; i < vrvToolkit.getPageCount(); i++) {
            // draw refs on the current page into the SVG
            const currentSVG = new DOMParser().parseFromString(vrvToolkit.renderToSVG(i + 1), 'image/svg+xml')
            for (const ref of refs) {
                if (!ref) continue
                ref
                    .split(' ')
                    .filter(target => vrvToolkit.getPageWithElement(target.slice(1)) === i + 1)
                    .forEach(target => {
                        const correspEl = currentSVG.querySelector(target) as SVGElement | null
                        if (!correspEl) return
                        correspEl.setAttribute('filter', 'url(#softGlow)')
                        correspEl.setAttribute('data-referenced', 'true')
                    })
            }
            svgs.push(new XMLSerializer().serializeToString(currentSVG))
        }
        setSVGs(svgs)
    }, [vrvToolkit, modernClefs, rightHand, emptyStaves, refs])

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
        const proximityPadding = 15

        const onMouseMove = (e: MouseEvent) => {
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
                if (data.corresps.length > 0) {
                    (data.corresps[0] as HTMLElement).scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    })
                }
            }
        }

        document.addEventListener('mousemove', onMouseMove)
        cleanups.push(() => {
            document.removeEventListener('mousemove', onMouseMove)
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

        // Show facsimile on mouseover
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
            .querySelectorAll('.staff[data-facs]')
            .forEach(staff => {
                const onMouseOver = (e: Event) => {
                    // Don't show facsimile when hovering on a referenced element (score-to-text link)
                    const target = e.target as Element | null
                    if (target?.closest('[data-referenced]')) return

                    cancelRemoveTimer()
                    if (document.querySelector('.zone-preview')) return

                    const zoneLinks = staff.getAttribute('data-facs')?.split(' ') || []

                    const selectedZones = zoneLinks
                        .map((zoneLink) => {
                            return zones.find((zone) => {
                                if (!zone) return false
                                return zone.xmlId === zoneLink.slice(1)
                            })
                        })
                        .filter(zone => !!zone && !!zone.imageApiUrl)
                        .map(zone => zone!.imageApiUrl!)

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

                const onMouseLeave = () => {
                    scheduleRemovePreview()
                }

                staff.addEventListener('mouseover', onMouseOver)
                staff.addEventListener('mouseleave', onMouseLeave)
                cleanups.push(() => {
                    staff.removeEventListener('mouseover', onMouseOver)
                    staff.removeEventListener('mouseleave', onMouseLeave)
                })
            })

        cleanups.push(() => cancelRemoveTimer())

        return () => {
            cleanups.forEach(cleanup => cleanup())
        }
    })

    return (
        <div className={`score ${isMainScore ? 'main-score' : 'example-score'} ${modernClefs ? 'modernized' : 'diplomatic'}`}>
            <div style={{
                float: isMainScore ? 'right' : 'left',
                border: '0.5px solid gray',
                borderRadius: '0.5rem'
            }}>
                <OptionToggle
                    value="check"
                    selected={modernClefs}
                    onChange={() => setModernClefs(!modernClefs)}
                >
                    {modernClefs ? '\u{1D121}' : '\u{1D122}'}
                </OptionToggle>

                {isMainScore && (
                    <>
                        <OptionToggle
                            value="check"
                            selected={rightHand}
                            onChange={() => setRightHand(!rightHand)}
                        >
                            {'{}'}
                        </OptionToggle>
                        <OptionButton onClick={() => setEmptyStaves(emptyStaves + 1)}>
                            +
                        </OptionButton>
                        <OptionButton onClick={() => setEmptyStaves(Math.max(emptyStaves - 1, 0))}>
                            -
                        </OptionButton>
                    </>
                )}
            </div>

            <div dangerouslySetInnerHTML={{ __html: svgs[currentPage - 1] }} />

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
