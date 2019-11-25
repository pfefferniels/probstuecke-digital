const transcription = require('express').Router(),
      fs = require('fs'),
      path = require('path'),
      vrvAdapter = require('./verovioAdapter.js');

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

  res.render('transcription', {
    number: number,
    label: label,
    language: edition,
    svgScore: vrvAdapter.renderSVG(number, label, 'score.mei', req.query.above, req.query.below, req.query.modernClefs),
    teiComment: fs.readFileSync(teiPath),
    midi: vrvAdapter.renderMIDI(number, label, 'score.mei')
   });
});

// generate PDF
transcription.get('/:number/:label/:edition/pdf', function(req, res) {
  let number = req.params.number;
  let label = req.params.label;
  let edition = req.params.edition;

  vrvAdapter.streamPDF(res, number, label, 'score.mei', req.query.above, req.query.below, req.query.modernClefs);
});

module.exports = transcription;
