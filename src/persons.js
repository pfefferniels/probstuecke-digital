const persons = require('express').Router(),
      exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig);

persons.get('/', function(req, res) {
  db.queries.readAll(
    `
    xquery version "3.1";
    declare namespace tei="http://www.tei-c.org/ns/1.0";
    for $persName in collection('/db/apps/probstuecke-digital/')//tei:body//tei:persName[@ref]
    let $place := <location>{substring-after(base-uri($persName), "probstuecke-digital/")}</location>
    order by $persName/@ref
    group by $persName
    return <person>{$persName}<locations>{$place}</locations></person>
    `, {})
    .then(function (result) {
      res.render('persons', {
        persons: '<persons>' + Buffer.concat(result.pages).toString() + '</persons>'
      });
    })
    .catch(e => console.error(e));
});

module.exports = persons;
