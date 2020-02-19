const exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig),
      verovio = require('verovio'),
      vrvToolkit = new verovio.toolkit(),
      PDFDocument = require('pdfkit'),
      SVGtoPDF = require('svg-to-pdfkit');

function parseMEI(number, label, file, options) {
  let queryParams = {
    variables: {
      input: ['/db/apps/probstuecke-digital', number, label, file].join('/'),
      stavesAbove: 0,
      stavesBelow: 0,
      modernClefs: false,
      removeAnnotationStaff: true
    }
  }

  if (options.above) {
    queryParams.variables.stavesAbove = options.above;
  }

  if (options.below) {
    queryParams.variables.stavesBelow = options.below;
  }

  if (options.showAnnotationStaff) {
    queryParams.variables.removeAnnotationStaff = !options.showAnnotationStaff;
  }

  if (options.modernClefs) {
    queryParams.variables.modernClefs = options.modernClefs;
  }

  return db.queries.readAll(`
      xquery version "3.1";
      declare namespace transform="http://exist-db.org/xquery/transform";

      let $xsl := doc('/db/apps/probstuecke-digital/transform-mei.xsl')
      return transform:transform(doc($input), $xsl,
      <parameters>
        <param name="stavesAbove" value="{$stavesAbove}" />
        <param name="stavesBelow" value="{$stavesBelow}" />
        <param name="modernClefs" value="{$modernClefs}" />
        <param name="removeAnnotationStaff" value="{$removeAnnotationStaff}" />
      </parameters>)`, queryParams);
}

// pdfkit setup
PDFDocument.prototype.addSVG = function(svg, x, y) {
  return SVGtoPDF(this, svg, x, y, {
    // in the exported PDF use Times Roman as standard font for SVGs
    fontCallback: function(family, bold, italic, options) {
      if (bold) {
        return "Times-Bold";
      }
      return "Times-Roman";
    }
  }), this;
};

function streamPDF(res, number, label, file, options) {
  const doc = new PDFDocument({
    size: "A4"
  });
  doc.info["Title"] = number + ". Probstück";
  doc.pipe(res);

  let mei = parseMEI(number, label, file, options);

  vrvToolkit.setOptions({
    pageHeight: 3200,
    adjustPageHeight: 0,
    noFooter: 1,
    scale: 33
  });
  vrvToolkit.loadData(mei.toString());

  let pageCount = vrvToolkit.getPageCount();
  for (let i=1; i<=pageCount; ++i) {
    doc.addSVG(vrvToolkit.renderToSVG(i, {}), 30, 30);
    if (i != pageCount) { // do not add a page after the last
      doc.addPage();
    }
  }

  doc.end();
}

module.exports.parseMEI = parseMEI;
module.exports.streamPDF = streamPDF;
