const transcription = require('express').Router(),
      exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig);
      vrvAdapter = require('../utils/verovioAdapter.js');

const lookupTable = {
  secondEdition: 'de',
  german: 'de',
  firstEdition: '1st',
  english: 'en'
};

function getTranscription(req, res) {
  let number = req.params.number;
  let label = req.params.label;
  let edition = req.params.edition;

  let teiPath = [
    '/db/apps/probstuecke-digital',
    number,
    label,
    'comments_' + lookupTable[edition] + '.xml'].join('/');

  let viewParams = {
    number: number,
    label: label
  }

  try {
    viewParams.svgScore = vrvAdapter.renderSVG(number, label, 'score.xml', req.query);
    viewParams.midi = vrvAdapter.renderMIDI(number, label, 'score.xml');
  } catch (e) { }

  db.documents.read(teiPath, {})
              .then(function (result) {
                viewParams.teiComment = result.toString();
              })
              .catch(function (e) {
                console.error(e);
              })
              .then(function () {
                res.render('transcription', viewParams);
              });
}

function getPDF(req, res) {
  let number = req.params.number;
  let label = req.params.label;
  let edition = req.params.edition;

  vrvAdapter.streamPDF(res,
                       req.params.number,
                       req.params.label,
                       'score.xml',
                       req.query);
}

transcription.get('/:number/:label/:edition', getTranscription);
transcription.get('/:number/:label/:edition/pdf', getPDF);

module.exports = transcription;
