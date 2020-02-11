const persons = require('express').Router(),
      exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig);

persons.get('/', function(req, res) {
  db.queries.readAll(
    `xquery version "3.1";
     declare namespace tei="http://www.tei-c.org/ns/1.0";
     collection('/db/apps/probstuecke-digital/')//tei:body//tei:persName`, {})
    .then(function (result) {
      res.render('persons', {
        persons: Buffer.concat(result.pages).toString()
      });
    })
    .catch(e => console.error(e));
});

module.exports = persons;
