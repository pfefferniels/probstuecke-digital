'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material'
import { downloadAs } from './DownloadDialog'
import { removeEmbeddedAnnotations } from '../helpers/removeEmbeddedAnnotations'
import { addEmptyStaves } from '../helpers/addEmptyStaves'
import { smuflFigures } from '../helpers/smuflFigures'
import { dropHiddenAccidentals } from '../helpers/dropHiddenAccidentals'
import { mdivLabel, mdivXPathQuery, topLevelMdivs } from '../helpers/mdivs'
import { readingsXPathQuery } from '../helpers/readings'
import { joinNames } from '@/lib/citation'

const junicode = '/Junicode.woff'
const junicodeBold = '/Junicode-Bold.woff'
const junicodeItalic = '/Junicode-Italic.woff'
const junicodeBoldItalic = '/Junicode-BoldItalic.woff'
const verovioTextFont = '/VerovioText.ttf'
const leipzigFont = '/Leipzig.ttf'

const paperSizes = {
    A4: {
        pageHeight: 2970,
        pageWidth: 2100,
    },
    Letter: {
        pageHeight: 2794,
        pageWidth: 2159,
    },
    B4: {
        pageHeight: 3530,
        pageWidth: 2500,
    },
}

// follows the standard margins of Sibelius
const margins = {
    narrow: 100,
    normal: 140,
    broad: 180,
}

const fonts = ['Leipzig', 'Bravura', 'Gootville', 'Leland']

// The notation itself is drawn as paths; only symbols within text (accidentals and raised
// figures in figured bass, tempo signs) use a music font. Leipzig is the one bundled.
const musicFontFamily = /Leipzig|Bravura|Gootville|Leland/

const scripts = new Map<string, Promise<void>>()

// Adds a script to the page once; one that failed to load is tried again on the next call
const loadScript = (src: string) => {
    let loaded = scripts.get(src)
    if (!loaded) {
        loaded = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = src
            script.addEventListener('load', () => resolve())
            script.addEventListener('error', () => {
                script.remove()
                scripts.delete(src)
                reject(new Error(`${src} could not be loaded`))
            })
            document.body.appendChild(script)
        })
        scripts.set(src, loaded)
    }
    return loaded
}

// PDFKit (window.PDFDocument), blob-stream (window.blobStream) and SVG-to-PDFKit are only
// needed here, so the piece pages do not load them until the PDF options are shown
const loadPDFLibraries = async () => {
    const [svgToPdf] = await Promise.all([
        import('svg-to-pdfkit'),
        loadScript('/pdfkit.standalone.js'),
        loadScript('/blob-stream.js'),
    ])
    return svgToPdf.default
}

interface ChoiceProps<T extends string> {
    label: string
    value: T
    options: { value: T, label: ReactNode }[]
    onChange: (value: T) => void
    /** focus the chosen option when shown */
    autoFocus?: boolean
}

// One setting of the PDF, with its options side by side (wrapping on narrow screens)
const Choice = <T extends string>({ label, value, options, onChange, autoFocus }: ChoiceProps<T>) => (
    <FormControl component="fieldset">
        <FormLabel component="legend">{label}</FormLabel>
        <RadioGroup row value={value} onChange={(_, value) => onChange(value as T)}>
            {options.map(option => (
                <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio size="small" autoFocus={autoFocus && option.value === value} />}
                    label={option.label}
                />
            ))}
        </RadioGroup>
    </FormControl>
)

// The PDF shows the music as the score on the page does (see NotatedMusic), e.g.
// "As on the page: C♯ major, original notation, with the right-hand staff and 2 empty staves."
const describeScoreSettings = (meiData: string) => {
    const { modernClefs, rightHand, emptyStaves, mdiv } = window.scoreSettings
    const mdivs = topLevelMdivs(new DOMParser().parseFromString(meiData, 'text/xml'))
    const shown = [
        mdivs.length > 1 && mdivs[mdiv] ? mdivLabel(mdivs[mdiv], mdiv) : null,
        modernClefs ? 'modern clefs and accidentals' : 'original notation',
    ].filter(Boolean)
    const added = [
        rightHand ? 'the right-hand staff' : null,
        emptyStaves === 1 ? 'an empty staff' : emptyStaves > 1 ? `${emptyStaves} empty staves` : null,
    ].filter((part): part is string => !!part)
    return `As on the page: ${shown.join(', ')}${added.length > 0 ? `, with ${joinNames(added)}` : ''}.`
}

interface ExportPDFModalProps {
    meiData: string
    fileName: string
    expressionId?: string
    onBack: () => void
}

export const ExportPDFModal = ({ meiData, fileName, expressionId, onBack }: ExportPDFModalProps) => {
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [format, setFormat] = useState<keyof typeof paperSizes>('A4')
    const [margin, setMargin] = useState<keyof typeof margins>('normal')
    const [font, setFont] = useState('Leipzig')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // the score settings do not change while the dialog is open
    const scoreAsShown = useMemo(() => describeScoreSettings(meiData), [meiData])

    // load them while the options are being chosen
    useEffect(() => {
        loadPDFLibraries().catch(() => { })
    }, [])

    const createPDF = async () => {
        const SVGtoPDF = await loadPDFLibraries()

        // Verovio is loaded by the VerovioProvider of the page
        const pdfToolkit = new window.verovio.toolkit()

        const dom = new DOMParser().parseFromString(meiData, 'text/xml')

        // as on the page: the notation of the piece (<mdiv>) shown, and the readings of its source
        const mdivs = topLevelMdivs(dom)
        const mdivIndex = window.scoreSettings.mdiv < mdivs.length ? window.scoreSettings.mdiv : 0
        const mdiv = mdivs[mdivIndex] || dom
        const readings = readingsXPathQuery(dom, expressionId)

        pdfToolkit.setOptions({
            font: font,
            adjustPageHeight: false,
            breaks: 'auto',
            mmOutput: true,
            breaksNoWidow: true,
            ...paperSizes[format],
            landscape: orientation === 'landscape',
            pageMarginLeft: margins[margin],
            pageMarginRight: margins[margin],
            pageMarginTop: margins[margin],
            pageMarginBottom: margins[margin],
            scale: 100,
            choiceXPathQuery: [window.scoreSettings.modernClefs ? './reg' : './orig'],
            ...(readings ? { appXPathQuery: readings } : {}),
            ...(mdivs.length > 1 ? { mdivXPathQuery: mdivXPathQuery(mdivIndex) } : {}),
        })

        // insert composer's name on the right side of pgHead
        const composerName = dom.querySelector('composer persName')?.textContent
        const composerRend = dom.createElementNS(
            'http://www.music-encoding.org/ns/mei',
            'rend'
        )
        composerRend.setAttribute('halign', 'right')
        composerRend.textContent = composerName || ''
        const pgHead = mdiv.querySelector('pgHead')
        pgHead?.appendChild(composerRend)

        // insert pgFoot with information on when the content was downloaded.
        const scoreDef = mdiv.querySelector('scoreDef')
        const pgFoot = dom.createElementNS(
            'http://www.music-encoding.org/ns/mei',
            'pgFoot'
        )
        const rend = dom.createElementNS(
            'http://www.music-encoding.org/ns/mei',
            'rend'
        )
        const date = new Date()
        rend.textContent = `This content was downloaded from probstuecke-digital.de
       on ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}.`
        pgFoot.appendChild(rend)
        scoreDef?.appendChild(pgFoot)

        if (!window.scoreSettings.rightHand) removeEmbeddedAnnotations(dom)
        addEmptyStaves(dom, window.scoreSettings.emptyStaves)
        smuflFigures(dom)
        dropHiddenAccidentals(dom, window.scoreSettings.modernClefs)

        pdfToolkit.loadData(new XMLSerializer().serializeToString(dom))

        const options = {
            fontCallback: function (family: string, bold: boolean, italic: boolean) {
                if (musicFontFamily.test(family)) return 'Leipzig'
                if (family.includes('VerovioText')) return 'VerovioText'
                if (bold && italic) return 'Junicode-BoldItalic'
                if (bold && !italic) return 'Junicode-Bold'
                if (!bold && italic) return 'Junicode-Italic'

                return 'Junicode'
            },
        }

        const doc = new window.PDFDocument({
            size: format,
            layout: orientation,
            // useCSS: true,
            compress: true,
            autoFirstPage: false,
        })

        const loadFont = async (name: string, file: string) => {
            const response = await fetch(file)
            const buffer = await response.arrayBuffer()
            doc.registerFont(name, buffer)
        }

        await loadFont('Junicode', junicode)
        await loadFont('Junicode-Bold', junicodeBold)
        await loadFont('Junicode-Italic', junicodeItalic)
        await loadFont('Junicode-BoldItalic', junicodeBoldItalic)
        await loadFont('VerovioText', verovioTextFont)
        await loadFont('Leipzig', leipzigFont)

        doc.info['Title'] = dom.querySelector('title')?.textContent || ''
        doc.info['Author'] = composerName || ''

        const stream = doc.pipe(window.blobStream())
        const finished = new Promise<Blob>(resolve => {
            stream.on('finish', () => resolve(stream.toBlob('application/pdf')))
        })

        for (let i = 0; i < pdfToolkit.getPageCount(); i++) {
            doc.addPage()
            SVGtoPDF(doc, pdfToolkit.renderToSVG(i + 1, {}), 0, 0, options)
        }

        doc.end()
        return finished
    }

    const exportPDF = async () => {
        setLoading(true)
        setError(null)
        try {
            downloadAs(fileName, await createPDF())
        }
        catch (e) {
            setError(`The PDF could not be created (${(e as Error).message}).`)
        }
        finally {
            setLoading(false)
        }
    }

    const [width, height] = orientation === 'landscape' ? ['pageHeight', 'pageWidth'] as const : ['pageWidth', 'pageHeight'] as const

    return (
        <>
            <Stack spacing={2}>
                <Choice
                    autoFocus
                    label="Paper"
                    value={format}
                    onChange={setFormat}
                    options={(Object.keys(paperSizes) as (keyof typeof paperSizes)[]).map(key => ({
                        value: key,
                        label: (
                            <>
                                {key}{' '}
                                <Typography component="span" variant="body2" color="text.secondary">
                                    {paperSizes[key][width] / 100} × {paperSizes[key][height] / 100} cm
                                </Typography>
                            </>
                        ),
                    }))}
                />
                <Choice
                    label="Orientation"
                    value={orientation}
                    onChange={setOrientation}
                    options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]}
                />
                <Choice
                    label="Margins"
                    value={margin}
                    onChange={setMargin}
                    options={(Object.keys(margins) as (keyof typeof margins)[]).map(key => ({
                        value: key,
                        label: `${key.charAt(0).toUpperCase()}${key.slice(1)} (${margins[key] / 100} cm)`,
                    }))}
                />
                <Choice
                    label="Music font"
                    value={font}
                    onChange={setFont}
                    options={fonts.map(font => ({ value: font, label: font }))}
                />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {scoreAsShown}
            </Typography>
            {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 3 }}>
                <Button onClick={onBack} disabled={loading}>Back</Button>
                <Button
                    variant="contained"
                    onClick={exportPDF}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                    {loading ? 'Creating PDF…' : 'Download PDF'}
                </Button>
            </Box>
        </>
    )
};
