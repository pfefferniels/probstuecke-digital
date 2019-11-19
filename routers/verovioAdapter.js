const fs = require('fs'),
      verovio = require('verovio'),
      vrvToolkit = new verovio.toolkit(),
      xmldom = require('xmldom'),
      path = require('path'),
      DOMParser = xmldom.DOMParser;

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

function renderSVG(number, label, file, modernClefs) {
  let data = fs.readFileSync(path.join(__dirname, '../data', number, label, file));
  let mei = data;
  if (modernClefs) {
    let doc = new DOMParser().parseFromString(data.toString(), 'text/xml');
    modernizeClefs(doc);
    mei = new xmldom.XMLSerializer().serializeToString(doc);
  }
  // render MEI
  vrvToolkit.setOptions({
    pageHeight: 30000,
    adjustPageHeight: 1,
    noFooter: 1
  });
  vrvToolkit.loadData(mei.toString());
  return vrvToolkit.renderToSVG(1, {});
}

function renderMIDI(number, label, file) {
  let data = fs.readFileSync(path.join(__dirname, '../data', number, label, file));
  vrvToolkit.loadData(data.toString());
  return vrvToolkit.renderToMIDI();
}

module.exports.renderSVG = renderSVG;
module.exports.renderMIDI = renderMIDI;
