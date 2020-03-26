const transcription = require('express').Router(),
      exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig);
      vrvAdapter = require('./parseMEI.js');

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
    'comments.xml'].join('/');

  let viewParams = {
    number: number,
    label: label
  }

  vrvAdapter.parseMEI(number, label, 'score.xml', req.query).then(function(result) {
    viewParams.mei = Buffer.concat(result.pages).toString();
  }).catch(function (e) {
    console.error(e);
  }).then(() => {
    return db.documents.read(teiPath, {})
  }).then(function (result) {
      viewParams.teiComment = result.toString();
  }).catch(function (e) {
      console.error(e);
  }).then(function () {
      res.render('transcription', viewParams);
  });
}

transcription.get('/:number/:label/:edition', getTranscription);

module.exports = transcription;
