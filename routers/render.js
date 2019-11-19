const render = require('express').Router(),
      vrvAdapter = require('./verovioAdapter.js');

render.get('/:number/:label/:file', function(req, res) {
  res.send(vrvAdapter.renderSVG(req.params.number, req.params.label, req.params.file));
});

module.exports = render;
