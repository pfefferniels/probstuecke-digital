// provide a simple AnnotationList service in the
// recommended URI pattern: /{prefix}/{identifier}/list/{name}

const path = require('path'),
      iiif = require('express').Router();

function sendAnnotationList(req, res) {
  if (isNaN(req.params.number)) {
    console.error("invalid query number passed.");
    res.status("404").end();
    return;
  }

  res.sendFile(path.join(__dirname, '../data', req.params.number, 'mattheson', (req.params.name+'.json')), function(err) {
    if (err) {
      console.error(err);
      res.status("404").end();
      return;
    }
  });
}

iiif.get('/:number/list/:name', sendAnnotationList);

module.exports = iiif;
