const render = require('express').Router(),
      vrvAdapter = require('./parseMEI.js');

render.get('/:number/:label/:file', function(req, res) {
  // do not add additional staves to the music examples
  req.query.above = req.query.below = 0;

  vrvAdapter.parseMEI(req.params.number,
           req.params.label,
           req.params.file,
           req.query).then(function(result) {
             res.send(Buffer.concat(result.pages).toString());
           }).catch(function (e) {
             console.error(e);
           });
});

module.exports = render;
