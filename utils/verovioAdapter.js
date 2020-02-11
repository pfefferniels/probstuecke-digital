const fs = require('fs'),
      exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig),
      verovio = require('verovio'),
      vrvToolkit = new verovio.toolkit(),
      xmldom = require('xmldom'),
      path = require('path'),
      DOMParser = xmldom.DOMParser,
      PDFDocument = require('pdfkit'),
      SVGtoPDF = require('svg-to-pdfkit');

// takes a DOM object and replaces all <clef>s and <staffDef>s with
// modern clefs
function modernizeClefs(doc) {
  const replacementMap = {
    "C1": {shape: "G", line: 2},
    "C2": {shape: "G", line: 2},
    "C3": {shape: "G", line: 2},
    "C4": {shape: "F", line: 4},
    "F3": {shape: "F", line: 4}
  };

  // find all <staffDef>s.
  const staffDefs = doc.documentElement.getElementsByTagName("staffDef");
  for (let i=0; i<staffDefs.length; i++) {
    const shape = staffDefs[i].getAttribute("clef.shape");
    const line = staffDefs[i].getAttribute("clef.line");
    const comb = shape + line;
    if (comb in replacementMap) {
      const replacement = replacementMap[comb];
      staffDefs[i].setAttribute("clef.line",  replacement.line);
      staffDefs[i].setAttribute("clef.shape", replacement.shape);
    }
  }

  // find all remaining clef changes
  const clefs = doc.documentElement.getElementsByTagName("clef");
  for (let i=0; i<clefs.length; i++) {
    const shape = clefs[i].getAttribute("shape");
    const line = clefs[i].getAttribute("line");
    const comb = shape + line;
    if (comb in replacementMap) {
      const replacement = replacementMap[comb];
      clefs[i].setAttribute("line",  replacement.line);
      clefs[i].setAttribute("shape", replacement.shape);
    }
  }
}

// staff numbering: the range from 20–29 is reserved for staff lines below.
function insertStavesBelow(n, doc) {
  for (let i=0; i<n; i++) {
    let staffGrp = doc.documentElement.getElementsByTagName("staffGrp")[0];
    let newStaffDef = doc.createElement("staffDef");
    newStaffDef.setAttribute("n", i+20);
    newStaffDef.setAttribute("lines", 5);
    staffGrp.appendChild(newStaffDef);
    let measures = doc.documentElement.getElementsByTagName("measure");
    for (let j=0; j<measures.length; j++) {
      let staff = doc.createElement("staff");
      let layer = doc.createElement("layer");
      let empty = doc.createElement("empty");
      staff.setAttribute("n", i+20);
      layer.setAttribute("n", 1);
      empty.setAttribute("dur", 1)
      measures[j].appendChild(staff);
    }
  }
}

// staff nu<bering: the range from 10–19 is reserved for staff lines above
function insertStavesAbove(n, doc) {
  for (let i=0; i<n; i++) {
    let staffGrp = doc.documentElement.getElementsByTagName("staffGrp")[0];
    let newStaffDef = doc.createElement("staffDef");
    newStaffDef.setAttribute("n", i+10);
    newStaffDef.setAttribute("lines", 5);
    staffGrp.insertBefore(newStaffDef, staffGrp.getElementsByTagName("staffDef")[0]);
    let measures = doc.documentElement.getElementsByTagName("measure");
    for (let j=0; j<measures.length; j++) {
      let staff = doc.createElement("staff");
      let layer = doc.createElement("layer");
      let empty = doc.createElement("empty");
      staff.setAttribute("n", i+10);
      layer.setAttribute("n", 1);
      empty.setAttribute("dur", 1)
      measures[j].insertBefore(staff, measures[j].getElementsByTagName("staff")[0]);
    }
  }
}

function removeAnnotationStaff(doc) {
  let n;
  let staffDefs = doc.documentElement.getElementsByTagName("staffDef");
  for (let i=0; i<staffDefs.length; i++) {
    if (staffDefs[i].getAttribute("xml:id") === "mattheson") {
      n = staffDefs[i].getAttribute("n");
      staffDefs[i].parentNode.removeChild(staffDefs[i]);
      i -= 1;
    }
  }

  let staffs = doc.documentElement.getElementsByTagName("staff");
  for (let i=0; i<staffs.length; i++) {
    if (staffs[i].getAttribute("n") == n) {
      staffs[i].parentNode.removeChild(staffs[i]);
      i -= 1;
    }
  }
}

function parseMEI(number, label, file, options) {
  let queryParams = {
    variables: {
      input: ['/db/apps/probstuecke-digital', number, label, file].join('/'),
      stavesAbove: options.above,
      stavesBelow: options.below,
      modernClefs: options.modernClefs,
      removeAnnotationStaff: !options.showAnnotationStaff
    }
  }

  return db.queries.readAll(`
    xquery version "3.1";
    declare namespace transform="http://exist-db.org/xquery/transform";
    let $xsl := doc('/db/styles/transform-mei.xsl')
    return transform:transform(doc($input), $xsl,
        <paramaters>
            <param name="stavesAbove" value="{$stavesAbove}" />
            <param name="stavesBelow" value="{$stavesBelow}" />
            <param name="modernClefs" value="{$modernClefs}" />
            <param name="removeAnnotationStaff" value="{$removeAnnotationStaff}" />
        </paramaters>)`, queryParams);
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

  let mei = prepareMEI(number, label, file, options);

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
module.exports.renderMIDI = renderMIDI;
module.exports.streamPDF = streamPDF;
