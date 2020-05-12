const index = require('express').Router(),
      db = require('./db.js');

index.get('/persons', function(req, res) {
  db.retrieve('indices/persons.xml')
    .then(function (response) {
      res.render('index', {
        tei: response.data
      });
    })
    .catch(e => console.error(e));
});

module.exports = index;
