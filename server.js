const verovio = require('verovio'),
      vrvToolkit = new verovio.toolkit(),
      fs = require('fs'),
      express = require('express'),
      xmldom = require('xmldom'),
      path = require('path'),
      PDFDocument = require('pdfkit'),
      DOMParser = xmldom.DOMParser,
      SVGtoPDF = require('svg-to-pdfkit');

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

// express.js setup
const app = express();
app.set('view engine', 'pug');
app.set('views', './views');

// prevent possible dot-dot-slash attacks
function preventDotDotSlash(userInput) {
  return path.parse(userInput).base;
}

function getAnnotationFilename(nr, lang) {
  return __dirname + "/data/" + nr + "/annotations_" + lang + ".tei";
}

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

// used in app.get("svg") and app.get("download")
function generateSvg(params, allpages, callback, onFinish, onError) {
  fs.readFile(__dirname + '/data/' + params.nr + '/score.mei', function(err, data) {
    if (err) {
      console.log(err);
      if (typeof onError === "function") {
        onError(err);
      }
      return;
    }

    let parser = new DOMParser({
                    locator: {},
                    errorHandler: {
                       warning: (msg) => {
                         console.log(msg);
                       },
                       error: (msg) => {
                         onError(msg);
                         return;
                       },
                       fatalError: (msg) => {
                         onError(msg);
                       }
                    }
    });

    var doc = parser.parseFromString(data.toString(), 'text/xml');

    // find all the staffs or layers that are not in the display parameter, remove their <staffDef> ...
    if (!params.display) {
      params.display = [];
    }
    var staffsToRemove = [];
    var staffDefs = doc.documentElement.getElementsByTagName("staffDef");
    for (let i=0; i<staffDefs.length; i++) {
      let xmlId = staffDefs[i].getAttribute("xml:id");
      if (!params.display.includes(xmlId) && xmlId != "bass") {
        let n = staffDefs[i].getAttribute("n");
        staffsToRemove.push(n);
        staffDefs[i].parentNode.removeChild(staffDefs[i]);
        i -= 1;
      }
    }

    var layersToRemove = [];
    var layerDefs = doc.documentElement.getElementsByTagName("layerDef");
    for (let i=0; i<layerDefs.length; i++) {
      let xmlId = layerDefs[i].getAttribute("xml:id");
      // layers must be named "layer-...". Thus ignoring the first six characters.
      if (!params.display.includes(xmlId.substring(6))) {
        let n = layerDefs[i].getAttribute("n");
        layersToRemove.push(n);
        layerDefs[i].parentNode.removeChild(layerDefs[i]);
      }
    }

    if (staffsToRemove.length > 0) {
      // ... and accordingly remove their <staff>s resp. <layer>s.
      let staffs = doc.documentElement.getElementsByTagName("staff");
      for (let i=0; i<staffs.length; i++) {
        if (staffsToRemove.includes(staffs[i].getAttribute("n"))) {
          staffs[i].parentNode.removeChild(staffs[i]);
          i -= 1;
        }
      }
    }

    if (layersToRemove.length > 0) {
      let layers = doc.documentElement.getElementsByTagName("layer");
      for (let i=0; i<layers.length; i++) {
        if (layersToRemove.includes(layers[i].getAttribute("n"))) {
          layers[i].parentNode.removeChild(layers[i]);
          i -= 1;
        }
      }
    }

    // modernize clefs
    if (params.modernClefs === 'true') {
      modernizeClefs(doc);
    }

    // more than 9 staffs below or above would exceed the space of one page
    // and will be ignored
    if (params.emptyStaffsBelow > 9) {
      params.emptyStaffsBelow = 9;
    }
    if (params.emptyStaffsAbove > 9) {
      params.emptyStaffsAbove = 9;
    }

    // insert empty staffs below
    // numbering: the range from 20–29 is reserved for staff lines below.
    for (let i=0; i<params.emptyStaffsBelow; i++) {
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

    // insert empty staffs above
    // numbering: the range from 10–19 is reserved for staff lines above
    for (let i=0; i<params.emptyStaffsAbove; i++) {
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

    var mei = new xmldom.XMLSerializer().serializeToString(doc);

    // render MEI
    vrvToolkit.setOptions({
      pageHeight: 2970,
      adjustPageHeight: 0,
      noFooter: 1
    });
    vrvToolkit.loadData(mei);
    let pageCount = vrvToolkit.getPageCount();
    if (allpages) {
      for (let i=1; i<=pageCount; i++) {
        callback(vrvToolkit.renderToSVG(i, {}));
      }
    } else {
      if ((params.page <= pageCount) && (params.page >= 1)) {
        callback(vrvToolkit.renderToSVG(params.page, {}));
      }
    }
    if (typeof onFinish === "function") {
      onFinish();
    }
  });
}


app.get("/annotations", function(req, res) {
  // make sure req.query.nr is indeed a number
  if (isNaN(req.query.nr)) {
    console.log("invalid query number passed.");
    res.status("404");
  }

  res.sendFile(getAnnotationFilename(req.query.nr, preventDotDotSlash(req.query.lang)), {}, function(err) {
    if (err) {
      console.log(err.status);
      res.status("404").end();
    }
  });
});

app.get('/music-example', function(req, res) {
  // make sure req.query.nr is indeed a number
  if (isNaN(req.query.nr)) {
    console.log("invalid query number passed.");
    res.status("404").end();
  }

  fs.readFile(__dirname + '/data/' + req.query.nr + '/' + preventDotDotSlash(req.query.filename), function(err, data) {
    if (err) {
      console.log(err);
      res.status("404").end();
      return;
    }

    let doc = new DOMParser().parseFromString(data.toString(), 'text/xml');
    if (req.query.modernClefs === "true") {
      modernizeClefs(doc);
    }

    let mei = new xmldom.XMLSerializer().serializeToString(doc);

    // render MEI
    vrvToolkit.setOptions({
      pageHeight: 10000,
      adjustPageHeight: 1,
      noFooter: 1
    });
    vrvToolkit.loadData(mei.toString());
    res.send(vrvToolkit.renderToSVG(1, {}));
  });
});

app.get('/render', function (req, res) {
  var jsonResponse = {};
  generateSvg(req.query, false, function(svg) {
    // on retrieving the rendered SVG
    jsonResponse.svg = svg;
  }, function() {
    // on success
    jsonResponse.pageCount = vrvToolkit.getPageCount();
    jsonResponse.midi = vrvToolkit.renderToMIDI();
    jsonResponse.timemap = vrvToolkit.renderToTimemap();
    res.send(jsonResponse);
  }, function(err) {
    // on error
    res.status("500").send(err);
  });
});

var AnnotationToPDF = {
  nr: 0,
  pdfDoc: undefined,
  normalFontSize: 34,
  _resetTextCursor() {
    this.pdfDoc.text("", {continued: false});
  },

  traverse: function(tree) {
    var children = tree.childNodes;
    for (let i=0; i<children.length; i++) {
      if (children[i].nodeName === "#text") {
        // for now, treat them all the same.
        if (children[i].parentNode.nodeName === "p" ||
            children[i].parentNode.nodeName === "ref" ||
            children[i].parentNode.nodeName === "foreign") {
          this.pdfDoc.font("Times-Roman").fontSize(this.normalFontSize).text(children[i].textContent, {
            align: 'justify',
            continued: true,
            lineGap: 10
          });
        } else if (children[i].parentNode.nodeName === "emph") {
          this.pdfDoc.font("Times-Bold").text(children[i].textContent, {
            align: 'justify',
            continued: true,
            lineGap: 10
          });
        }
      } else if ((children[i].nodeName === "note") ||
                 (children[i].nodeName === "teiHeader")) {
        // notes and meta information are ignored for now.
        continue;
      } else if (children[i].nodeName === "head") {
        // no further subchildren are expected
        this.pdfDoc.moveDown(2);
        this._resetTextCursor();
        this.pdfDoc.font("Times-Bold").fontSize(this.normalFontSize+5).text(children[i].textContent, {
          align: 'center',
          continued: false,
          lineGap: 30
        });
      } else if (children[i].nodeName === "ptr" && children[i].parentNode.nodeName === "notatedMusic") {
        // load music examples
        let target = children[i].attributes[0].value;
        let contents = fs.readFileSync(__dirname + "/data/" + this.nr + "/" + target, 'utf8');

        vrvToolkit.setOptions({
          adjustPageHeight: 1,
          noFooter: 1
        });
        vrvToolkit.loadData(contents);
        let pageCount = vrvToolkit.getPageCount();
        for (let j=1; j<=pageCount; ++j) {
          if (pageCount > 1) {
            this.pdfDoc.addPage();
          }
          let svg = vrvToolkit.renderToSVG(j, {});

          // find the page height
          let regexResult = svg.match(/<svg width="(\d)+px" height="((\d)+)px"/);
          if (regexResult.length < 3) {
            console.error("The generated SVG has an unexpected format.");
            continue;
          }
          let pageHeight = regexResult[2];

          this.pdfDoc.addSVG(svg, this.pdfDoc.x, this.pdfDoc.y);
          this.pdfDoc.y += pageHeight * 0.72 + 10;
        }
        this._resetTextCursor();
      } else {
        this.traverse(children[i]);
      }
    }
  }
};

app.get("/download", function(req, res) {
  if (isNaN(req.query.nr)) {
    console.log("invalid query number passed.");
    res.status("404").end();
  }

  if (req.query.exportFormat === "pdf") {
    const doc = new PDFDocument({
      size: "A1",
      margin: 80
    });
    doc.info["Title"] = req.query.nr + ". Probstück";
    //doc.font("Times-Bold").fontSize(38);
    doc.pipe(res);

    generateSvg(req.query, true, function(svg) {
      doc.addSVG(svg, 100, 100).scale(0.5);
      doc.addPage();
    }, function() {
      // when all the score pages are there, start adding the annotations
      fs.readFile(getAnnotationFilename(req.query.nr, req.query.lang), function(err, data) {
        if (err) {
          console.log(err);
          res.status("404").end();
          return;
        }

        // PDFKit will realize the newlines in the original TEI file as new paragraphs. To prevent,
        // all line breaks have to be removed first.
        var annotationDoc = new DOMParser().parseFromString(data.toString().replace(/\s\s+/g, ' '), 'text/xml');
        var converter = Object.create(AnnotationToPDF);
        converter.nr = req.query.nr;
        converter.pdfDoc = doc;
        converter.traverse(annotationDoc);

        doc.end();
      });
    });
  } else if (req.query.exportFormat === "musicxml") {
    // TODO not implemented yet
    res.status("404").end();
  }
  else {
    res.status("404").end();
  }
});

app.get('/description', function(req, res) {
  if (isNaN(req.query.nr)) {
    console.log("invalid query number passed.");
    res.status("404").end();
  }

  res.sendFile(__dirname + '/data/' + req.query.nr + '/description.json', function(err) {
    if (err) {
      console.log(err);
      res.status("404").end();
      return;
    }
  });
});

app.get('^/:number([0-9]{1,2})', function(req, res) {
  // Mattheson wrote precisely 24 Prob-Stücke.
  if (req.params.number > 24) {
    res.status("404").send("Prob-Stück " + req.params.number + " does not exist.");
  } else {
    res.render('index', {
      number: req.params.number
     });
  }
});

app.get('/', function(req, res) {
  res.render('introduction');
});

app.use(express.static('public'));

app.listen(process.env.PORT || 3000, function() {
  console.log('Listening');
});
