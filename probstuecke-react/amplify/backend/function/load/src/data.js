const data = require('express').Router(),
      parameters = require('./parameters.js'),
      db = require('./db.js');

data.get('/toc', async function(req, res) {
  let response = await db.retrieve('toc.json');
  res.send(response.data);
});

data.get('/guidelines', async function(req, res) {
  db.retrieveAsStream(`guidelines/guidelines_en.xml`)
    .then(response => {
      res.type('application/xml');
      response.data.pipe(res);
    })
    .catch(e => {
      console.error(e);
      res.status(500).send('Failed loading guidelines');
    });
});

data.get('/indices/:file', async function(req,res) {
  db.retrieveAsStream(`indices/${req.params.file}`)
    .then(response => {
      res.type('application/xml');
      response.data.pipe(res);
    })
    .catch(e => {
      console.error(e);
      res.status(500).send('Failed loading index');
    });
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
        res.status(500).send('Failed loading file');
      });
  } else if (file.endsWith('.xml')) {
    if (file.startsWith('comments')) {
      db.retrieveAsStream('transform-tei.xql?' + parameters.serialize2(number, author, file))
        .then(response => {
          res.type('application/xml');
          response.data.pipe(res);
        })
        .catch(e => {
          console.error(e);
          res.status(500).send('Failed loading TEI file');
        });
    } else {
      db.retrieveAsStream('transform-mei.xql?' + parameters.serialize(number, author, file, req.query))
        .then(response => {
          res.type('application/xml');
          response.data.pipe(res);
        })
        .catch(e => {
          console.error(e);
          res.status(500).send(`Failed loading MEI file. Calling db.retrieveAsStream("transform-mei.xql?"${parameters.serialize(number, author, file, req.query)})`);
        });
    }
  }
});

module.exports = data;
