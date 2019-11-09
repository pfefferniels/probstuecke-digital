const render = require("./render.js"),
      path = require('path'),
      fs = require('fs'),
      xmldom = require('xmldom'),
      prettifyXml = require('prettify-xml'),
      DOMParser = xmldom.DOMParser;

// prevent possible dot-dot-slash attacks
function preventDotDotSlash(userInput) {
  return path.parse(userInput).base;
}

function getAnnotationFilename(nr, lang) {
  return path.join(__dirname, "../data", nr, "annotations_"+lang+".tei");
}

function hasZoneWithSameTarget(doc, target) {
  let zones = doc.getElementsByTagName("zone");
  for (let i=0; i<zones.length; i++) {
    if (zones[i].getAttribute("xml:id") == target) {
      return true;
    }
  }
  return false;
}

function createFacsimileElement(doc, regions, scanPage, before, referencedTags) {
  let facsimile = doc.getElementsByTagName("facsimile");
  // create a facsimile element if there isn't one yet
  if (facsimile.length == 0) {
    let facsimileNode = doc.createElement("facsimile");
    facsimileNode.setAttribute("decls", "#secondEdition");
    let meiBody = doc.getElementsByTagName(before)[0];
    facsimile = doc.insertBefore(facsimileNode, meiBody);
  } else {
    facsimile = facsimile[0];
  }

  let surface = doc.createElement("surface");
  surface.setAttribute("ulx", "0");
  surface.setAttribute("uly", "0");
  surface.setAttribute("lrx", "1998");
  surface.setAttribute("lry", "2396");
  surface.setAttribute("xml:id", "facs-p"+scanPage);

  let graphic = doc.createElement("graphic");
  graphic.setAttribute("width", "1998");
  graphic.setAttribute("height", "2396");
  graphic.setAttribute("target", "https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb10598495/canvas/" + scanPage);
  surface.appendChild(graphic);

  for (let i=0; i<regions.length; i++) {
    for (let n=0; n<referencedTags.length; n++) {
      let tags = doc.getElementsByTagName(referencedTags[n]);
      for (let j=0; j<tags.length; j++) {
        let xmlId = tags[j].getAttribute("xml:id");
        if (xmlId == regions[i].text) {
          if (tags[j].hasAttribute("facs")) {
            let combinedFacs = tags[j].getAttribute("facs") + " #facsZone-" + regions[i].text + "-2";
            tags[j].setAttribute("facs", combinedFacs);
          } else {
            tags[j].setAttribute("facs", "#facsZone-" + regions[i].text);
          }
        }
      }
    }

    let zone = doc.createElement("zone");
    let geometry = regions[i].shapes[0].geometry;
    zone.setAttribute("ulx", ~~(geometry.x * 1998));
    zone.setAttribute("uly", ~~(geometry.y * 2396));
    zone.setAttribute("lrx", ~~((geometry.x+geometry.width) * 1998));
    zone.setAttribute("lrx", ~~((geometry.y+geometry.height) * 2396));
    let facsZoneId = "facsZone-" + regions[i].text;
    if (hasZoneWithSameTarget(doc, facsZoneId)) {
      zone.setAttribute("xml:id", facsZoneId+"-2");
    } else {
      zone.setAttribute("xml:id", facsZoneId);
    }
    surface.appendChild(zone);
    facsimile.appendChild(surface);
  }
}

function annotateFile(req, res) {
  let regions = req.body["regions"];
  let nr = req.body.nr;
  let scanPage = req.body.scanPage;
  let type = req.body.type;

  if (type === "music") {
    // read score.mei in xmldom, insert tags etc., serialize and overwrite
    fs.readFile(path.join(__dirname, '../data', nr, 'score.mei'), function(err, data) {
      console.log(err);
      let doc = new DOMParser().parseFromString(data.toString(), 'text/xml');

      let before = "body",
          referencedTags = ["staff"];
      createFacsimileElement(doc, regions, scanPage, before, referencedTags)

      let mei = new xmldom.XMLSerializer().serializeToString(doc);
      fs.mkdirSync(path.join(__dirname, '../tmp', nr), { recursive: true });
      let targetFile = path.join(__dirname, '../tmp', nr, 'score.mei');
      fs.writeFile(targetFile, prettifyXml(mei), function (err) {
        if (err) throw err;
        console.log("saved");
      });
    });
  } else if (type == "text") {
    // read annotations_de.tei in xmldom, insert tags etc., serialize and overwrite
    fs.readFile(path.join(__dirname, '../data', nr, 'annotations_de.tei'), function(err, data) {
      console.log(err);
      let doc = new DOMParser().parseFromString(data.toString(), 'text/xml');

      let before = "text",
          referencedTags = ["p", "notatedMusic"];
      createFacsimileElement(doc, regions, scanPage, before, referencedTags);

      let tei = new xmldom.XMLSerializer().serializeToString(doc);
      fs.mkdirSync(path.join(__dirname, '../tmp', nr), { recursive: true });
      let targetFile = path.join(__dirname, '../tmp', nr, 'annotations_de.tei');
      fs.writeFile(targetFile, prettifyXml(tei), function (err) {
        if (err) throw err;
        console.log("saved");
      });
    });
  }

  // AnnotationList
  const iiifPath = path.join(__dirname, '../data', nr, 'facsimile_de.json');
  var iiifObject;
  if (fs.existsSync(iiifPath)) {
    iiifObject = JSON.parse(fs.readFileSync(iiifPath));
  } else {
    iiifObject = {
      "@context": "http://iiif.io/api/presentation/2/context.json",
      "@id": "https://probstuecke-digital.de/iiif/1/list/facsimile_de",
      "@type": "sc:AnnotationList",
      "resources": []
    };
  }

  for (let i=0; i<regions.length; i++) {
    let geometry = regions[i].shapes[0].geometry;

    let xywh = [ ~~(geometry.x * 1998),
                 ~~(geometry.y * 2396),
                 ~~(geometry.width * 1998),
                 ~~(geometry.height * 2396) ].join(",");

    let annotation = {
      "@context": "http://iiif.io/api/presentation/2/context.json",
      "@id": "https://probstuecke-digital.de/iiif/1/annotation/facsimile_de-page" + scanPage,
      "@type": "oa:Annotation",
      "motivation": "sc:painting",
    };

    if (type == "text") {
      let referencedTag = "";
      if (regions[i].text.startsWith("music-example")) {
        referencedTag = "notatedMusic";
      } else {
        referencedTag = "p";
      }
      annotation.resource = {
        "@id": "http://probstuecke-digital.de/iiif/" + nr + "/annotations_de.tei#xpointer(//" + referencedTag + "[xml:id='" + regions[i].text+ "'])",
        "@type": "dctypes:Image",
        "format": "application/tei+xml"
      };
    } else {
      annotation.resource = {
        "@id": "http://probstuecke-digital.de/iiif/" + nr + "/score.mei#xpointer(//staff[xml:id='" + regions[i].text+ "'])",
        "@type": "dctypes:Image",
        "format": "application/mei+xml"
      };
    }
    annotation.on = "https://api.digitale-sammlungen.de/iiif/presentation/v2/bsb10598495/canvas/" + scanPage + "#xywh=" + xywh;
    iiifObject.resources.push(annotation);
  }

  newIIIFContent = JSON.stringify(iiifObject, null, 4);
  fs.mkdirSync(path.join(__dirname, '../tmp', nr), { recursive: true });
  const newIIIFPath = path.join(__dirname, '../tmp', nr, 'facsimile_de.json');
  fs.writeFile(newIIIFPath, newIIIFContent, function(err) {
    if (err) {
      console.error(err);
    }
    console.log("AnnotationList written into facsimile_de.json");
  });
}

function annotatedFile(req, res) {
  let type = req.query.type;
  let nr = req.query.nr;

  if (type == "music") {
    res.download(path.join(__dirname, '../tmp', nr, 'score.mei'));
  } else if (type == "text") {
    res.download(path.join(__dirname, '../tmp', nr, 'annotations_de.tei'));
  } else if (type == "iiif") {
    res.download(path.join(__dirname, '../tmp', nr, 'facsimile_de.json'));
  }
}

exports.preventDotDotSlash = preventDotDotSlash;
exports.getAnnotationFilename = getAnnotationFilename;
exports.annotateFile = annotateFile;
exports.annotatedFile = annotatedFile;
