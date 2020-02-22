// provide a simple AnnotationList service in the
// recommended URI pattern: /{prefix}/{identifier}/list/{name}

const axios = require('axios'),
      existConfig = require('../existConfig.json'),
      iiif = require('express').Router();

function sendAnnotationList(req, res) {
  if (isNaN(req.params.number)) {
    console.error('invalid query number passed.');
    res.status('404').end();
    return;
  }

  let annotationListPath = [
    'db/apps/probstuecke-digital',
    req.params.number,
    'mattheson',
    (req.params.name+'.json')
  ].join('/');

  axios.get(`http://${existConfig.host}:${existConfig.port}/exist/rest/${annotationListPath}`)
    .then(response => {
      res.json(response.data);
    })
    .catch(e => {
      console.error(e);
    });
}

iiif.get('/:number/list/:name', sendAnnotationList);

module.exports = iiif;
