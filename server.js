var verovio = require('verovio-dev');
var fs = require('fs')
var http = require('http');
var express = require('express');
var xmldom = require('xmldom');
var DOMParser = xmldom.DOMParser;


var vrvToolkit = new verovio.toolkit();
var app = express();

app.get("/CETEI.js", function(req, res) {
  res.sendFile(__dirname + "/CETEI.js");
});

app.get("/facsimile", function(req, res) {
  res.send("Hello World");
});

app.get("/annotations", function(req, res) {
  res.sendFile(__dirname + "/annotations" + req.query.nr + '.tei');
});

app.get('/svg', function (req, res) {
  fs.readFile(__dirname + '/probstueck' + req.query.nr + '.mei', function(err, data) {
    var doc = new DOMParser().parseFromString(data.toString(),'text/xml');
    
    // hide stems
    if (req.query.hideStems === 'true') {
      console.log("hiding stems");
      // add attribute stems.len='0.0mm' to all <staff>s where attribute "n='1'"
      var staffs = doc.documentElement.getElementsByTagName("staff");
      for (i=0; i<staffs.length; i++) {
        if (staffs[i].getAttribute("n") == "1") {
          var notes = staffs[i].getElementsByTagName("note");
          if (notes != undefined) {
            for (j=0; j<notes.length; j++) {
              notes[j].setAttribute("stem.len", "0.0mm");
            }
          }
        }
      }
    }
    
    // insert empty staffs below
    for (i=0; i<req.query.emptyStaffsBelow; i++) {
      var staffGrp = doc.documentElement.getElementsByTagName("staffGrp")[0];
      var newStaffDef = doc.createElement("staffDef");
      newStaffDef.setAttribute("n", i+3);
      newStaffDef.setAttribute("lines", 5);
      staffGrp.appendChild(newStaffDef);
      var measures = doc.documentElement.getElementsByTagName("measure");
      for (j=0; j<measures.length; j++) {
        var staff = doc.createElement("staff");
        var layer = doc.createElement("layer");
        var empty = doc.createElement("empty");
        staff.setAttribute("n", i+2);
        layer.setAttribute("n", 1);
        empty.setAttribute("dur", 1)
        measures[j].appendChild(staff);
      }
    } 
    
    // insert empty staffs above
    for (i=0; i<req.query.emptyStaffsAbove; i++) {
      var staffGrp = doc.documentElement.getElementsByTagName("staffGrp")[0];
      var newStaffDef = doc.createElement("staffDef");
      newStaffDef.setAttribute("n", i+3);
      newStaffDef.setAttribute("lines", 5);
      staffGrp.insertBefore(newStaffDef, staffGrp.getElementsByTagName("staffDef")[0]);
      var measures = doc.documentElement.getElementsByTagName("measure");
      for (j=0; j<measures.length; j++) {
        var staff = doc.createElement("staff");
        var layer = doc.createElement("layer");
        var empty = doc.createElement("empty");
        staff.setAttribute("n", i+3);
        layer.setAttribute("n", 1);
        empty.setAttribute("dur", 1)
        measures[j].insertBefore(staff, measures[j].getElementsByTagName("staff")[0]);
      }
    } 
    
    
    mei = new xmldom.XMLSerializer().serializeToString(doc);
    //console.log(mei);
    
    // render MEI
    var options = {
      noFooter: 1
    };
    vrvToolkit.setOptions(options);
    vrvToolkit.loadData(mei);
    svg = vrvToolkit.renderToSVG(req.query.page, {});
    res.send(svg);
  });
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
app.listen(port, ipaddress, function() {
  console.log('Listening on port ' + port);
});

