const references = require('express').Router(),
      db = require('./db.js'),
      querystring = require('querystring');

references.get('/', function(req, res) {
  let escaped = querystring.encode({
    ref: req.query.ref
  });

  db.retrieve('find-references.xql?' + escaped).then(function (response) {
      res.send(response.data);
    })
    .catch(e => console.error(e));
});

module.exports = references;
