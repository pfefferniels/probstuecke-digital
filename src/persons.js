const persons = require('express').Router(),
      db = require('./db.js');

persons.get('/', function(req, res) {
  db.retrieve('list-persons.xql')
    .then(function (response) {
      res.render('persons', {
        persons: '<persons>' + response.data + '</persons>'
      });
    })
    .catch(e => console.error(e));
});

module.exports = persons;
