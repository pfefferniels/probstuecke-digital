const transcription = require('express').Router(),
      fs = require('fs'),
      path = require('path'),
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

  let teiPath = path.join(
    __dirname,
    '/../data',
    number,
    label,
    'comments_' + lookupTable[edition] + '.tei');

  let viewParams = {
    number: number,
    label: label
  }

  try {
    viewParams.svgScore = vrvAdapter.renderSVG(number, label, 'score.mei',
                                   req.query.above,
                                   req.query.below,
                                   req.query.modernClefs == 'on');
    viewParams.midi = vrvAdapter.renderMIDI(number, label, 'score.mei');
  } catch (e) {  }

  try {
    viewParams.teiComment = fs.readFileSync(teiPath);
  } catch (e) { }

  res.render('transcription', viewParams);
}

function getPDF(req, res) {
  let number = req.params.number;
  let label = req.params.label;
  let edition = req.params.edition;

  vrvAdapter.streamPDF(res,
                       req.params.number,
                       req.params.label,
                       'score.mei',
                       req.query.above, req.query.below, req.query.modernClefs);
}

transcription.get('/:number/:label/:edition', getTranscription);
transcription.get('/:number/:label/:edition/pdf', getPDF);

module.exports = transcription;
