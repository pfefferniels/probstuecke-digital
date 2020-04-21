const render = require('express').Router(),
      parameters = require('./parameters.js'),
      db = require('./db.js');

render.get('/:number/:label/:file', function(req, res) {
  // do not add additional staves to the music examples
  req.query.above = req.query.below = 0;

  let file = req.params.file,
      number = req.params.number,
      label = req.params.label;

  if (file.endsWith('.ogg')) {
    let audioPath = [number,
                     label,
                     file].join('/');

    db.retrieveAsStream(audioPath)
      .then(response => {
        response.data.pipe(res);
      })
      .catch(e => {
        console.error(e);
      });

  } else if (file.endsWith('.xml')) {
    db.retrieveAsStream('transform-mei.xql?' + parameters.serialize(number, label, file, req.query))
      .then(response => {
        response.data.pipe(res);
      })
      .catch(e => {
        console.error(e);
      });
  }
});

module.exports = render;
