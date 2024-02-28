import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useVerovio } from '../hooks/useVerovio';
import { Stack, Pagination, ToggleButton, ToggleButtonProps, Button, ButtonProps } from '@mui/material';
import { addEmptyStaves } from '../helpers/addEmptyStaves';
import { removeEmbeddedAnnotations } from '../helpers/removeEmbeddedAnnotations';

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

declare global {
    interface Window {
        highlightRefs: (refs: string[]) => () => void;
    }
}

window.highlightRefs = window.highlightRefs || ((_: string) => { });

interface NotatedMusicProps {
    teiNode: Element,
    meis: readonly (Queries.expressionMei | null)[]
    refs: readonly (string | null)[]
}

export const NotatedMusic = ({ teiNode, meis, refs }: NotatedMusicProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [svgs, setSVGs] = useState<string[]>([])
    const [modernClefs, setModernClefs] = useState(false)
    const [rightHand, setRightHand] = useState(false)
    const [emptyStaves, setEmptyStaves] = useState(0)

    const teiId = teiNode.getAttribute('id');
    const isMainScore = teiId === 'score'

    const { vrvToolkit } = useVerovio()

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

        const corresp = meis.find((mei: any) => mei.xmlId === teiId)
        if (!corresp || !corresp.mei) return

        let mei = corresp.mei
        const meiDoc = new DOMParser().parseFromString(mei, 'application/xml')

        if (isMainScore && !rightHand) removeEmbeddedAnnotations(meiDoc)
        addEmptyStaves(meiDoc, emptyStaves)

        mei = new XMLSerializer().serializeToString(meiDoc)
        if (emptyStaves > 0) {
            console.log('new MEI with', mei)
        }

        vrvToolkit.setOptions({
            scale: 30,
            footer: modernClefs ? 'auto' : 'none',
            pageHeight: 2000,
            adjustPageHeight: true,
            svgViewBox: true,
            header: 'none',
            choiceXPathQuery: [modernClefs ? './reg' : './orig']
        })
        console.log(vrvToolkit.getOptions().choiceXPathQuery)
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
        document
            .querySelectorAll('[data-referenced]')
            .forEach(ref => {
                const meiId = ref.getAttribute('id')
                if (!meiId) return

                const corresps = document.querySelectorAll(`[data-target~="#${meiId}"]`)
                let dehighlight: () => void

                ref.addEventListener('mouseover', () => {
                    corresps.forEach(corresp => {
                        (corresp as HTMLElement).classList.add('highlight')
                    })
                    dehighlight = window.highlightRefs([meiId])
                })

                ref.addEventListener('mouseleave', () => {
                    corresps.forEach(corresp => {
                        (corresp as HTMLElement).classList.remove('highlight')
                    })
                    dehighlight()
                })
            })
    })

    return (
        <div className={`score ${isMainScore ? 'main-score' : 'example-score'}`}>
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
                    {modernClefs ? '𝄡' : '𝄢'}
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
        </div >
    )
}
