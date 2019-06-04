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

function generateSvg(req, allpages, callback, onFinish, onError) {
  // used in app.get("svg") and app.get("download")
  
  fs.readFile(__dirname + '/data/' + req.query.nr + '/score.mei', function(err, data) {
    if (err) {
      console.log(err);
      if (typeof onError === "function") {
        onError(err);
      }
      return;
    }
    var doc = new DOMParser().parseFromString(data.toString(),'text/xml');
    
    var staffsToRemove = [];
    
    // hide realized annotations
    if (req.query.showRealizedAnnotations === 'false') {
      staffsToRemove.push("1");
    }
    
    // hide decolorized bass
    if (req.query.decolorizedBass === 'false') {
      staffsToRemove.push("30");
    }
    
    if (req.query.basseFondamentale === 'false') {
      staffsToRemove.push("31");
    }
    
    if (req.query.exampleRealization1 === 'false') {
      staffsToRemove.push("41");
    }
    
    console.log(staffsToRemove);
    
    // remove all the <staff>s if the attribute n is on the removal list.
    var staffs = doc.documentElement.getElementsByTagName("staff");
    
    for (var j=0; j<staffsToRemove.length; j++) {
      for (var i=0; i<staffs.length; i++) {
        if (staffs[i].getAttribute("n") == staffsToRemove[j]) {
          staffs[i].parentNode.removeChild(staffs[i]);
        }
      }
    }
    
    
    // modernize clefs
    if (req.query.modernClefs === 'true') {
      modernizeClefs(doc);
    }
    
    // more than 9 staffs below or above would exceed the space of one page
    // and will be ignored
    if (req.query.emptyStaffsBelow > 9) {
      req.query.emptyStaffsBelow = 9
    }
    if (req.query.emptyStaffsAbove > 9) {
      req.query.emptyStaffsAbove = 9
    }
    
    // insert empty staffs below
    // numbering: the range from 20–29 is reserved for staff lines below.
    for (i=0; i<req.query.emptyStaffsBelow; i++) {
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
    for (i=0; i<req.query.emptyStaffsAbove; i++) {
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
      if ((req.query.page <= pageCount) && (req.query.page >= 1)) {
        callback(vrvToolkit.renderToSVG(req.query.page, {}));
      }
    }
    if (typeof onFinish === "function") {
      onFinish();
    }
  });
}

app.get("/annotations", function(req, res) {
  var fileToSend = __dirname + "/data/" + req.query.nr;
  if (req.query.lang === "en") {
    fileToSend += "/annotations_en.tei";
  } else if (req.query.lang === "facsimile") {
    fileToSend += "/facsimile.tei";
  } else if (req.query.lang === "first_edition") {
    fileToSend += "/annotations_1st.tei";
  } else {
    fileToSend += "/annotations.tei";
  }
  
  res.sendFile(fileToSend, {}, function(err) {
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
    svg = vrvToolkit.renderToSVG(1, {});
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
  generateSvg(req, false, function(svg) {
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

app.get("/download", function(req, res) {
  if (req.query.exportFormat === "pdf") {
    const doc = new PDFDocument({
      size: "A1"
    });
  
    doc.pipe(res);
  
    generateSvg(req, true, function(svg) {
      doc.addSVG(svg, 100, 100, {}).scale(0.5);
      doc.addPage();
    }, function() {
      doc.end();
    });
  } 
  else {
    res.status("404").end();
  }
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.use(express.static('public'));

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
app.listen(port, ipaddress, function() {
  console.log('Listening on port ' + port);
});

