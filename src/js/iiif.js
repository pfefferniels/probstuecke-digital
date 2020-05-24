// provide a simple AnnotationList service in the
// recommended URI pattern: /{prefix}/{identifier}/list/{name}

const iiif = require('express').Router(),
      db = require('./db.js');

function sendAnnotationList(req, res) {
  if (isNaN(req.params.number)) {
    console.error('invalid query number passed.');
    res.status('404').end();
    return;
  }

  let annotationListPath = [
    req.params.number,
    'mattheson',
    (req.params.name+'.json')
  ].join('/');

  db.retrieve(annotationListPath)
    .then(response => {
      res.json(response.data);
    })
    .catch(e => {
      console.error(e);
    });
}

iiif.get('/:number/list/:name', sendAnnotationList);

module.exports = iiif;
