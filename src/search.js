const search = require('express').Router(),
      db = require('./db.js'),
      querystring = require('querystring');

search.get('/', function(req, res) {
  let escaped = querystring.encode({
    q: req.query.q
  });

  db.retrieve('search.xql?' + escaped).then(function (response) {
      res.render('search', {
        result: response.data
      });
    })
    .catch(e => console.error(e));
});

module.exports = search;
