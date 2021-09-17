import SVGtoPDF from 'svg-to-pdfkit'
import blobStream from 'blob-stream'
import saveAs from 'save-as'
import { pdfToolkit } from '../Verovio'
import { apiUrl } from '../../config.js'
import junicode from '../../assets/Junicode.woff'
import junicodeBold from '../../assets/Junicode-Bold.woff'
import junicodeItalic from '../../assets/Junicode-Italic.woff'
import junicodeBoldItalic from '../../assets/Junicode-BoldItalic.woff'
import verovioTextFont from '../../assets/VerovioText.ttf'

const generatePDF = async (meiData) => {
  const options = {
    fontCallback: function(family, bold, italic, fontOptions) {
      if (family === 'VerovioText') return family
      if (bold && italic) return 'Junicode-BoldItalic'
      if (bold && !italic) return 'Junicode-Bold'
      if (!bold && italic) return 'Junicode-Italic'

      return 'Junicode'
    }
  }

  let doc = new window.PDFDocument({
    size: 'A4',
    useCSS: true,
    compress: true,
    autoFirstPage: false
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

  doc.info['Title'] = 'Probstück'

  let stream = doc.pipe(blobStream())
  stream.on('finish', function() {
    const blob = stream.toBlob('application/pdf')
    saveAs(blob, 'probstueck.pdf')
  })

  pdfToolkit.setOptions({
    adjustPageHeight: false,
    breaks: 'auto',
    mmOutput: true,
    footer: 'none',
    pageHeight: 2970,
    pageWidth: 2100,
    scale: 100
  })
  pdfToolkit.loadData(meiData)

  const date = new Date()
  for (let i=0; i < pdfToolkit.getPageCount(); i++) {
    doc.addPage()
    SVGtoPDF(doc, pdfToolkit.renderToSVG(i+1, {}), 0, 0, options)
    doc.text(`This content was downloaded from probstuecke-digital.de
              on ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}.`,
             20, doc.page.height-50, {
               lineBreak: false,
               align: 'center'
             })
  }

  doc.end()
}

export default generatePDF
