const render = require('express').Router(),
      vrvAdapter = require('../utils/verovioAdapter.js');

render.get('/:number/:label/:file', function(req, res) {
  res.send(vrvAdapter.renderSVG(req.params.number, req.params.label, req.params.file, req.query));
});

module.exports = render;
