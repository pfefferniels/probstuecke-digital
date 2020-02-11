const render = require('express').Router(),
      vrvAdapter = require('../utils/verovioAdapter.js');

render.get('/:number/:label/:file', function(req, res) {
  vrvAdapter.parseMEI(req.params.number,
           req.params.label,
           req.params.file,
           req.query).then(function(result) {
             res.send(result.toString());
           }).catch(function (e) {
             console.error(e);
           });
});

module.exports = render;
