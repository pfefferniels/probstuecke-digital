import SVGtoPDF from 'svg-to-pdfkit'
import blobStream from 'blob-stream'
import saveAs from 'save-as'
import { pdfToolkit } from '../Verovio'

const generatePDF = meiData => {
  const options = {
    fontCallback: function(family, bold, italic, fontOptions) {
      if (family === 'VerovioText') return family
      if (bold && italic) return 'Times-BoldItalic'
      if (bold && !italic) return 'Times-Bold'
      if (!bold && italic) return 'Times-Italic'
      if (!bold && !italic) return 'Times-Roman'
    }
  }

  let doc = new window.PDFDocument({
    size: 'A4',
    useCSS: true,
    compress: true,
    autoFirstPage: false
  })
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
