const data = require('express').Router(),
      parameters = require('./parameters.js'),
      db = require('./db.js');

data.get('/toc', async function(req, res) {
  let response = await db.retrieve('toc.json');
  res.send(response.data);
});

data.get('/guidelines', async function(req, res) {
  let response = await db.retrieve('guidelines/guidelines_en.xml');
  res.send(response.data);
});

data.get('/indices/:file', async function(req,res) {
  let response = await db.retrieve(`indices/${req.params.file}`);
  res.send(response.data);
});

data.get('/:number/:author/:file', function(req, res) {
  let file = req.params.file,
      number = req.params.number,
      author = req.params.author;

  if (file.endsWith('.ogg') || file.endsWith('.json')) {
    let path = [number,
                author,
                file].join('/');

    db.retrieveAsStream(path)
      .then(response => {
        response.data.pipe(res);
      })
      .catch(e => {
        console.error(e);
      });
  } else if (file.endsWith('.xml')) {
    if (file.startsWith('comments')) {
      db.retrieveAsStream('transform-tei.xql?' + parameters.serialize2(number, author, file))
        .then(response => {
          response.data.pipe(res);
        })
        .catch(e => {
          console.error(e);
        });
    } else {
      db.retrieveAsStream('transform-mei.xql?' + parameters.serialize(number, author, file, req.query))
        .then(response => {
          response.data.pipe(res);
        })
        .catch(e => {
          console.error(e);
        });
    }
  }
});

module.exports = data;
