'use client'

import { useState } from 'react'
import SVGtoPDF from 'svg-to-pdfkit'
import { Button, CircularProgress, Tab, Tabs, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { downloadAs } from './DownloadDialog'
import { removeEmbeddedAnnotations } from '../helpers/removeEmbeddedAnnotations'
import { addEmptyStaves } from '../helpers/addEmptyStaves'

const junicode = '/Junicode.woff'
const junicodeBold = 'Junicode-Bold.woff'
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

interface ExportPDFModalProps {
    meiData: string
}

export const ExportPDFModal = ({ meiData }: ExportPDFModalProps) => {
    const [activeTab, setActiveTab] = useState(0)
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [format, setFormat] = useState<'A4' | 'Letter' | 'B4'>('A4')
    const [margin, setMargin] = useState<'narrow' | 'normal' | 'broad'>('normal')
    const [font, setFont] = useState('Leipzig')
    const [loading, setLoading] = useState(false)

    const exportPDF = async () => {
        setLoading(true)

        const script = document.createElement("script");
        script.type = "application/javascript";
        script.src = "/verovio-toolkit-wasm.js";
        document.body.appendChild(script);

        script.defer = true;
        script.addEventListener("load", () => {

        });

        const pdfToolkit = new window.verovio.toolkit()

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
        })

        const dom = new DOMParser().parseFromString(meiData, 'text/xml')

        // insert composer's name on the right side of pgHead
        const composerName = dom.querySelector('composer persName')?.textContent
        const composerRend = dom.createElementNS(
            'http://www.music-encoding.org/ns/mei',
            'rend'
        )
        composerRend.setAttribute('halign', 'right')
        composerRend.textContent = composerName || ''
        const pgHead = dom.querySelector('pgHead')
        pgHead?.appendChild(composerRend)

        // insert pgFoot with information on when the content was downloaded.
        const scoreDef = dom.querySelector('scoreDef')
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

        pdfToolkit.loadData(new XMLSerializer().serializeToString(dom))

        const options = {
            fontCallback: function (family: string, bold: boolean, italic: boolean) {
                if (family === 'Leipzig') return family
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
        stream.on('finish', function () {
            setLoading(false)
            const blob = stream.toBlob('application/pdf')
            downloadAs('probstueck.pdf', blob)
            // onHide()
        })

        for (let i = 0; i < pdfToolkit.getPageCount(); i++) {
            doc.addPage()
            SVGtoPDF(doc, pdfToolkit.renderToSVG(i + 1, {}), 0, 0, options)
        }

        doc.end()
    }

    return (
        <div>
            <Tabs value={activeTab} sx={{ mb: 2 }} onChange={(_, newValue) => setActiveTab(newValue)} aria-label="Export PDF Options">
                <Tab label="Orientation" />
                <Tab label="Format" />
                <Tab label="Margins" />
                <Tab label="Font" />
                <Tab label="Staff Size" disabled />
            </Tabs>
            <div hidden={activeTab !== 0}>
                <ToggleButtonGroup
                    value={orientation}
                    exclusive
                    onChange={(event, newOrientation) => setOrientation(newOrientation)}
                    aria-label="Orientation"
                >
                    {['portrait', 'landscape'].map((orientation, i) => (
                        <ToggleButton key={`orientation_${i}`} value={orientation} aria-label={orientation}>
                            {orientation}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>
            <div hidden={activeTab !== 1}>
                <ToggleButtonGroup
                    value={format}
                    exclusive
                    onChange={(event, newFormat) => setFormat(newFormat)}
                    aria-label="Format"
                >
                    {Object.entries(paperSizes).map(([key, value], i) => (
                        <ToggleButton key={`format_${i}`} value={key} aria-label={key}>
                            {key}
                            {orientation === 'landscape' ? (
                                <span>
                                    ({value.pageWidth / 100}cm x {value.pageHeight / 100}cm)
                                </span>
                            ) : (
                                <span>
                                    ({value.pageHeight / 100}cm x {value.pageWidth / 100}cm)
                                </span>
                            )}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>
            <div hidden={activeTab !== 2}>
                <ToggleButtonGroup
                    value={margin}
                    exclusive
                    onChange={(event, newMargin) => setMargin(newMargin)}
                    aria-label="Margin"
                >
                    {Object.entries(margins).map(([key, value], i) => (
                        <ToggleButton key={`margin_${i}`} value={key} aria-label={key}>
                            {key} ({value / 100}cm)
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>
            <div hidden={activeTab !== 3}>
                <ToggleButtonGroup
                    value={font}
                    exclusive
                    onChange={(event, newFont) => setFont(newFont)}
                    aria-label="Font"
                >
                    {fonts.map((font, i) => (
                        <ToggleButton key={`font_${i}`} value={font} aria-label={font}>
                            {font}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="contained" color="primary" onClick={exportPDF} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Export'}
                </Button>
            </div>
        </div>
    )
};
