const transcription = require('express').Router(),
      exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig);
      vrvAdapter = require('./parseMEI.js');

const lookupTable = {
  secondEdition: 'de',
  german: 'de',
  firstEdition: '1st',
  english: 'en'
};

function getTranscription(req, res) {
  let number = req.params.number;
  let label = req.params.label;
  let edition = req.params.edition;

  let teiPath = [
    '/db/apps/probstuecke-digital',
    number,
    label,
    'comments_' + lookupTable[edition] + '.xml'].join('/');

  let viewParams = {
    number: number,
    label: label
  }

  vrvAdapter.parseMEI(number, label, 'score.xml', req.query).then(function(result) {

    // provide the MEI score
    viewParams.mei = Buffer.concat(result.pages).toString();
  }).catch(function (e) {
    console.error('failed loading MEI:', e);
  }).then(() => {

    // provide the corresponding key characteristics
    return db.queries.readAll(`
      xquery version "3.1";
      declare namespace mei="http://www.music-encoding.org/ns/mei";
      let $input := doc('/db/apps/probstuecke-digital/${number}/${label}/score.xml')
      let $pname := string($input//mei:scoreDef/@key.pname)
      let $accid := string($input//mei:scoreDef/@key.accid)
      let $pname := if($accid = 'f') then (
                      $pname || 'b'
                    ) else if($accid = 's') then (
                      $pname || '#'
                    ) else (
                      $pname
                    )
      let $mode := string($input//mei:scoreDef/@key.mode)
      return doc('/db/apps/probstuecke-digital/tonality/' || $pname || '.' || $mode || '.xml')
      `, {});
  }).then((result) => {
      viewParams.keyCharacteristics = Buffer.concat(result.pages).toString();
  }).catch((e) => {
      console.info('no correspoinding key characteristics found:', e);
  }).then(() => {

    // provide the corresponding meter characteristics
    return db.queries.readAll(`
      xquery version "3.1";
      declare namespace mei="http://www.music-encoding.org/ns/mei";
      let $input := doc('/db/apps/probstuecke-digital/${number}/${label}/score.xml')
      let $count := string($input//mei:staffDef[1]/@meter.count)
      let $unit := string($input//mei:staffDef[1]/@meter.unit)
      return doc('/db/apps/probstuecke-digital/meter/' || $count || '.' || $unit || '.xml')
      `, {});
  }).then((result) => {
      viewParams.meterCharacteristics = Buffer.concat(result.pages).toString();
  }).catch((e) => {
      console.info('no correspoinding meter characteristics found:', e);
  }).then(() => {

    // provide the TEI
    return db.documents.read(teiPath, {})
  }).then((result) => {
    viewParams.teiComment = result.toString();
  }).catch((e) => {
    console.error('failed loading TEI comments:', e);
  }).then(() => {

    // and deliver everything
    res.render('transcription', viewParams);
  });
}

transcription.get('/:number/:label/:edition', getTranscription);

module.exports = transcription;
