var verovio = require('verovio-dev');
var fs = require('fs')
var http = require('http');
var express = require('express');
var xmldom = require('xmldom');
var PDFDocument = require('pdfkit');
var DOMParser = xmldom.DOMParser;
var SVGtoPDF = require('svg-to-pdfkit');
 
PDFDocument.prototype.addSVG = function(svg, x, y, options) {
  return SVGtoPDF(this, svg, x, y, options), this;
};

var options = {
  noFooter: 1
};

var vrvToolkit = new verovio.toolkit();
vrvToolkit.setOptions(options);
var app = express();

function getAnnotationFilename(nr, lang) {
  return __dirname + "/data/" + nr + "/annotations_" + lang + ".tei";
}

// takes a DOM object and replaces all <clef>s and <staffDef>s with
// modern clefs
function modernizeClefs(doc) {
  // find all <staffDef>s. 
  var staffDefs = doc.documentElement.getElementsByTagName("staffDef");
  for (var i=0; i<staffDefs.length; i++) {
    var shape = staffDefs[i].getAttribute("clef.shape");
    var line = staffDefs[i].getAttribute("clef.line");
    
    if (shape === "C") {
      if (line === "1") {
        // replace discant clef with G-clef
        staffDefs[i].setAttribute("clef.line", "2");
        staffDefs[i].setAttribute("clef.shape", "G");
      } else if (line === "3") {
        // replace altus clef with G-clef
        staffDefs[i].setAttribute("clef.line", "2");
        staffDefs[i].setAttribute("clef.shape", "G");
      } else if (line === "4") {
        // replace tenor clefs with F-clef
        staffDefs[i].setAttribute("clef.line", "4");
        staffDefs[i].setAttribute("clef.shape", "F");
      }
    } else if (shape === "F" && line === 3) {
      // replace with normal F-clef
      staffDefs[i].setAttribute("clef.line", "4");
    }
  }
  
  // find all remaining clef changes 
  // TODO redundant with above code. Use a map?
  var clefs = doc.documentElement.getElementsByTagName("clef");
  for (var i=0; i<clefs.length; i++) {
    var shape = clefs[i].getAttribute("shape");
    var line = clefs[i].getAttribute("line");
    
    if (shape === "C") {
      if (line === "1") {
        // replace discant clef with G-clef
        clefs[i].setAttribute("line", "2");
        clefs[i].setAttribute("shape", "G");
      } else if (line === "3") {
        // replace altus clef with G-clef (?)
        clefs[i].setAttribute("line", "2");
        clefs[i].setAttribute("shape", "G");
      } else if (line === "4") {
        // replace tenor clefs with F-clef
        clefs[i].setAttribute("line", "4");
        clefs[i].setAttribute("shape", "F");
      }
    } else if (shape === "F" && line === 3) {
      // replace with normal F-clef
      clefs[i].setAttribute("line", "4");
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
                         onError();
                         return;
                       },
                       fatalError: (msg) => { 
                         onError();
                       }
                    }
    });
    
    var doc = parser.parseFromString(data.toString(), 'text/xml');
    
    // find all the staffs that are not in the display parameter, remove their <staffDef> ...
    if (!params.display) {
      params.display = [];
    }
    var toRemove = [];
    var staffDefs = doc.documentElement.getElementsByTagName("staffDef");
    for (var i=0; i<staffDefs.length; i++) {
      var xmlId = staffDefs[i].getAttribute("xml:id");
      var n = staffDefs[i].getAttribute("n");
      console.log(xmlId + " contained by " + params.display);
      if (!params.display.includes(xmlId) && n != 2) {
        console.log("yes, removing");
        toRemove.push(staffDefs[i].getAttribute("n"));
        staffDefs[i].parentNode.removeChild(staffDefs[i]);
        i -= 1;
      }
    }
    
    console.log("toRemove=" + toRemove);
    console.log("params.display=" + params.display);
    
    // ... and accordingly remove their <staff>s.
    let staffs = doc.documentElement.getElementsByTagName("staff");
    for (var i=0; i<staffs.length; i++) {
      if (toRemove.includes(staffs[i].getAttribute("n"))) {
        staffs[i].parentNode.removeChild(staffs[i]);
        i -= 1;
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
    for (i=0; i<params.emptyStaffsBelow; i++) {
      var staffGrp = doc.documentElement.getElementsByTagName("staffGrp")[0];
      var newStaffDef = doc.createElement("staffDef");
      newStaffDef.setAttribute("n", i+20);
      newStaffDef.setAttribute("lines", 5);
      staffGrp.appendChild(newStaffDef);
      var measures = doc.documentElement.getElementsByTagName("measure");
      for (j=0; j<measures.length; j++) {
        var staff = doc.createElement("staff");
        var layer = doc.createElement("layer");
        var empty = doc.createElement("empty");
        staff.setAttribute("n", i+20);
        layer.setAttribute("n", 1);
        empty.setAttribute("dur", 1)
        measures[j].appendChild(staff);
      }
    }
    
    // insert empty staffs above
    // numbering: the range from 10–19 is reserved for staff lines above
    for (i=0; i<params.emptyStaffsAbove; i++) {
      var staffGrp = doc.documentElement.getElementsByTagName("staffGrp")[0];
      var newStaffDef = doc.createElement("staffDef");
      newStaffDef.setAttribute("n", i+10);
      newStaffDef.setAttribute("lines", 5);
      staffGrp.insertBefore(newStaffDef, staffGrp.getElementsByTagName("staffDef")[0]);
      var measures = doc.documentElement.getElementsByTagName("measure");
      for (j=0; j<measures.length; j++) {
        var staff = doc.createElement("staff");
        var layer = doc.createElement("layer");
        var empty = doc.createElement("empty");
        staff.setAttribute("n", i+10);
        layer.setAttribute("n", 1);
        empty.setAttribute("dur", 1)
        measures[j].insertBefore(staff, measures[j].getElementsByTagName("staff")[0]);
      }
    } 
    
    var mei = new xmldom.XMLSerializer().serializeToString(doc);
    
    // render MEI
    vrvToolkit.loadData(mei);
    var pageCount = vrvToolkit.getPageCount();
    if (allpages) {
      for (var i=1; i<=pageCount; i++) {
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
  res.sendFile(getAnnotationFilename(req.query.nr, req.query.lang), {}, function(err) {
    if (err) {
      console.log(err.status);
      res.status("404").end();
    }
  });
});



app.get('/music-example', function(req, res) {
  fs.readFile(__dirname + '/data/' + req.query.nr + '/' + req.query.filename, function(err, data) {
    if (err) {
      console.log(err);
      res.send("internal error (file not found?)");
      return;
    }
    
    var doc = new DOMParser().parseFromString(data.toString(), 'text/xml');
    if (req.query.modernClefs === "true") {
      modernizeClefs(doc);
    } 
    
    var mei = new xmldom.XMLSerializer().serializeToString(doc);
    
    // render MEI
    vrvToolkit.loadData(mei.toString());
    svg = vrvToolkit.renderToSVG(1, {
      adjustPageHeight: 1
    });
    res.send(svg);
  });
});

// expected staff numbering:
// 1: realized annotations
// 2: original bass
// 10–19: empty staff lines above
// 20–29: empty staff lines below
// 30–39: analysis
// 40–49: realizations

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
    res.status("404").end();
  });
});

var AnnotationToPDF = {
  nr: 0,
  pdfDoc: undefined,
  traverse: function(tree) {
    var children = tree.childNodes;
    for (var i=0; i<children.length; i++) {
      if (children[i].nodeName === "#text") {
        // for now, treat them all the same.
        if (children[i].parentNode.nodeName === "p" ||
            children[i].parentNode.nodeName === "ref" || 
            children[i].parentNode.nodeName === "emph" ||
            children[i].parentNode.nodeName === "foreign") {
          this.pdfDoc.text(children[i].textContent, {
            width: 1500,
            align: 'justify',
            continued: true,
            indent: 0
          });
        } 
      } else if (children[i].nodeName === "head") {
        // no further subchildren are expected
        this.pdfDoc.moveDown(1);
        this.pdfDoc.fontSize(29).text(children[i].textContent, {
          width: 1500,
          align: 'center',
          underline: true
        });
        this.pdfDoc.fontSize(25);
      } else if (children[i].nodeName === "ptr") {
        // load music examples
        var target = children[i].attributes[0].value;
        var contents = fs.readFileSync(__dirname + "/data/" + this.nr + "/" + target, 'utf8');
        var doc = new DOMParser().parseFromString(contents.toString(), 'text/xml');
        var mei = new xmldom.XMLSerializer().serializeToString(doc);
      
        vrvToolkit.loadData(mei.toString());
        svg = vrvToolkit.renderToSVG(1, {
          adjustPageHeight: true
        });

        this.pdfDoc.addSVG(svg, this.pdfDoc.x, this.pdfDoc.y, {});
        this.pdfDoc.moveDown(20);
      } else {
        this.traverse(children[i]);
      }
    }
  }
};

app.get("/download", function(req, res) {
  if (req.query.exportFormat === "pdf") {
    const doc = new PDFDocument({
      size: "A1"
    });
  
    doc.pipe(res);
  
    generateSvg(req.query, true, function(svg) {
      doc.addSVG(svg, 100, 100, {}).scale(0.5);
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
        var annotationDoc = new DOMParser().parseFromString(data.toString().replace(/(\r\n|\n|\r)/gm, ""), 'text/xml');
        var converter = Object.create(AnnotationToPDF);
        converter.nr = req.query.nr;
        doc.font("Times-Roman").fontSize(25);
        converter.pdfDoc = doc;
        converter.traverse(annotationDoc);
        
        doc.end();
      });
    });
  } else if (req.query.exportFormat === "musicxml") {
    // TODO this is currently broken, since the mei2musicxml stylesheet requires XSLT 2.0,
    // while, libxslt supports only XSLT 1.0
    // var meiString = fs.readFileSync(__dirname + "/data/" + req.query.nr + "/score.mei","utf-8");
    // var xsltString = fs.readFileSync(__dirname + "/mei2musicxml.xsl","utf-8");
    // 
    // libxslt.parse(xsltString, function(err, stylesheet) {
    //   if (stylesheet) {
    //     stylesheet.apply(meiString, {}, function(err, result){
    //       res.send(musicXMLString);
    //     });  
    //   }
    // });
    res.status("404").end();
  } 
  else {
    res.status("404").end();
  }
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get('/description', function(req, res) {
  res.sendFile(__dirname + '/data/' + req.query.nr + '/description.json', function(err) {
    if (err) {
      console.log(err);
      res.send("internal error (file not found?)");
      return;
    }
  });
});

app.use(express.static('public'));

app.listen(process.env.PORT || 3000, function() {
  console.log('Listening');
});

