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

index.get('/musicalWorks', function(req, res) {
  db.retrieve('indices/musical-works.xml')
    .then(function (response) {
      res.render('index', {
        tei: response.data
      });
    })
    .catch(e => console.error(e));
});

index.get('/bibliography', function(req, res) {
  db.retrieve('indices/bibliography.xml')
    .then(function (response) {
      res.render('index', {
        tei: response.data
      });
    })
    .catch(e => console.error(e));
});

module.exports = index;
