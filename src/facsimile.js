const facsimile = require('express').Router();

facsimile.get('/:number/:edition', function(req, res) {
  res.render('facsimile', {
    number: req.params.number,
    edition: (req.params.edition == 'firstEdition') ? '1st' : 'de'
   });
});

module.exports = facsimile;
