const render = require('express').Router(),
      parameters = require('./parameters.js'),
      db = require('./db.js');

render.get('/:number/:author/:file', function(req, res) {
  // do not add additional staves to the music examples
  req.query.above = req.query.below = 0;

  let file = req.params.file,
      number = req.params.number,
      author = req.params.author;

  if (file.endsWith('.ogg')) {
    let audioPath = [number,
                     author,
                     file].join('/');

    db.retrieveAsStream(audioPath)
      .then(response => {
        response.data.pipe(res);
      })
      .catch(e => {
        console.error(e);
      });

  } else if (file.endsWith('.xml')) {
    db.retrieveAsStream('transform-mei.xql?' + parameters.serialize(number, author, file, req.query))
      .then(response => {
        response.data.pipe(res);
      })
      .catch(e => {
        console.error(e);
      });
  }
});

module.exports = render;
