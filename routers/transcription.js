const transcription = require('express').Router(),
      fs = require('fs'),
      path = require('path'),
      vrvAdapter = require('../utils/verovioAdapter.js');

const lookupTable = {
  secondEdition: 'comments_de.tei',
  firstEdition: 'comments_1st.tei',
  german: 'comments_de.tei',
  english: 'comments_en.tei'
};

transcription.get('/:number/:label/:edition', function(req, res) {
  let number = req.params.number;
  let label = req.params.label;
  let edition = req.params.edition;

  let teiPath = path.join(
    __dirname,
    '/../data',
    number,
    label,
    lookupTable[edition]);

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
});

// generate PDF
transcription.get('/:number/:label/:edition/pdf', function(req, res) {
  let number = req.params.number;
  let label = req.params.label;
  let edition = req.params.edition;

  vrvAdapter.streamPDF(res, number, label, 'score.mei', req.query.above, req.query.below, req.query.modernClefs);
});

module.exports = transcription;
