import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Button,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Spinner,
} from 'react-bootstrap'
import SVGtoPDF from 'svg-to-pdfkit'
import blobStream from 'blob-stream'
import saveAs from 'save-as'
import { pdfToolkit } from '../Verovio'
import junicode from '../../assets/Junicode.woff'
import junicodeBold from '../../assets/Junicode-Bold.woff'
import junicodeItalic from '../../assets/Junicode-Italic.woff'
import junicodeBoldItalic from '../../assets/Junicode-BoldItalic.woff'
import verovioTextFont from '../../assets/VerovioText.ttf'

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

const ExportPDFModal = ({ show, onHide, meiData }) => {
  const [orientation, setOrientation] = useState('portrait')
  const [format, setFormat] = useState('A4')
  const [margin, setMargin] = useState('normal')
  const [font, setFont] = useState('Leipzig')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const exportPDF = async () => {
    setLoading(true)

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
    })

    const dom = new DOMParser().parseFromString(meiData, 'text/xml')

    // insert composer's name on the right side of pgHead
    const composerName = dom.querySelector('composer persName').textContent
    const composerRend = dom.createElementNS(
      'http://www.music-encoding.org/ns/mei',
      'rend'
    )
    composerRend.setAttribute('halign', 'right')
    composerRend.textContent = composerName
    const pgHead = dom.querySelector('pgHead')
    pgHead.appendChild(composerRend)

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
    scoreDef.appendChild(pgFoot)

    pdfToolkit.loadData(new XMLSerializer().serializeToString(dom))

    const options = {
      fontCallback: function (family, bold, italic, fontOptions) {
        if (family === 'VerovioText') return family
        if (bold && italic) return 'Junicode-BoldItalic'
        if (bold && !italic) return 'Junicode-Bold'
        if (!bold && italic) return 'Junicode-Italic'

        return 'Junicode'
      },
    }

    const doc = new window.PDFDocument({
      size: format,
      layout: orientation,
      useCSS: true,
      compress: true,
      autoFirstPage: false,
    })

    const loadFont = async (name, file) => {
      const response = await fetch(file)
      const buffer = await response.arrayBuffer()
      doc.registerFont(name, buffer)
    }

    await loadFont('Junicode', junicode)
    await loadFont('Junicode-Bold', junicodeBold)
    await loadFont('Junicode-Italic', junicodeItalic)
    await loadFont('Junicode-BoldItalic', junicodeBoldItalic)
    await loadFont('VerovioText', verovioTextFont)

    doc.info['Title'] = dom.querySelector('title').textContent
    doc.info['Author'] = composerName

    let stream = doc.pipe(blobStream())
    stream.on('finish', function () {
      setLoading(false)
      const blob = stream.toBlob('application/pdf')
      saveAs(blob, 'probstueck.pdf')
      onHide()
    })

    for (let i = 0; i < pdfToolkit.getPageCount(); i++) {
      doc.addPage()
      SVGtoPDF(doc, pdfToolkit.renderToSVG(i + 1, {}), 0, 0, options)
    }

    doc.end()
  }

  return (
    <Modal show={show} size='lg' centered>
      <Modal.Body>
        <Tabs defaultActiveKey='orientation' className='mb-3'>
          <Tab eventKey='orientation' title={t('orientation')}>
            <ToggleButtonGroup
              value={orientation}
              onChange={(event, newOrientation) => {
                setOrientation(newOrientation.target.value)
              }}
              exclusive
              aria-label='Orientation'
              name='orientation'
            >
              {['portrait', 'landscape'].map((orientation, i) => {
                return (
                  <ToggleButton
                    key={`orientation_${i}`}
                    name='orientation'
                    value={orientation}
                    variant='outline-primary'
                    aria-label={orientation}
                  >
                    {t(orientation)}
                  </ToggleButton>
                )
              })}
            </ToggleButtonGroup>
          </Tab>
          <Tab eventKey='format' title={t('format')}>
            <ToggleButtonGroup
              value={format}
              onChange={(event, newFormat) => {
                setFormat(newFormat.target.value)
              }}
              exclusive
              aria-label='Format'
              name='format'
            >
              {Object.entries(paperSizes).map(([key, value], i) => {
                return (
                  <ToggleButton
                    key={`format_${i}`}
                    name='format'
                    value={key}
                    variant='outline-primary'
                    aria-label={key}
                  >
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
                )
              })}
            </ToggleButtonGroup>
          </Tab>
          <Tab eventKey='margins' title={t('margins')}>
            <ToggleButtonGroup
              value={margin}
              onChange={(event, newMargin) => {
                setMargin(newMargin.target.value)
              }}
              exclusive
              aria-label='Margin'
              name='margin'
            >
              {Object.entries(margins).map(([key, value], i) => {
                return (
                  <ToggleButton
                    key={`margin_${i}`}
                    name='margin'
                    value={key}
                    variant='outline-primary'
                    aria-label={key}
                  >
                    {t(key)} ({value / 100}cm)
                  </ToggleButton>
                )
              })}
            </ToggleButtonGroup>
          </Tab>
          <Tab eventKey='font' title={t('font')}>
            <ToggleButtonGroup
              value={font}
              onChange={(event, newFont) => {
                setFont(newFont.target.value)
              }}
              exclusive
              aria-label='Font'
              name='font'
            >
              {fonts.map((font, i) => {
                return (
                  <ToggleButton
                    key={`font_${i}`}
                    name='font'
                    value={font}
                    variant='outline-primary'
                    aria-label={font}
                  >
                    {font}
                  </ToggleButton>
                )
              })}
            </ToggleButtonGroup>
          </Tab>
          <Tab eventKey='staffSize' title={t('staffSize')} disabled>
            <div>{t('staffSize')}</div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='primary' onClick={exportPDF} disabled={loading}>
          {loading ? <Spinner animation='border' /> : t('export')}
        </Button>
        <Button variant='secondary' onClick={onHide}>
          {t('close')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ExportPDFModal
