const view = require('express').Router(),
      db = require('./db.js'),
      parameters = require('./parameters.js');

const lookupTable = {
  secondEdition: 'de',
  german: 'de',
  firstEdition: '1st',
  english: 'en'
};

async function composeView(req, res) {
  let number = req.params.number;
  let author = req.params.author;
  let edition = req.params.edition;

  let teiPath = [
    number,
    author,
    'comments_' + lookupTable[edition] + '.xml'].join('/');

  let viewParams = {
    number: number,
    author: author,
    edition: edition
  }

  try {
    let response = await db.retrieve('transform-mei.xql?' +
                    parameters.serialize(number, author, 'score.xml', req.query));
    viewParams.mei = response.data;
  } catch (e) {
    console.warn(e);
  }

  try {
    let response = await db.retrieve(teiPath)
    viewParams.teiComment = response.data;
  } catch (e) {
    console.warn(e);
  }

  try {
    let response = await db.retrieve(`get-key-character.xql?number=${number}&author=${author}`)
    viewParams.keyCharacteristics = response.data;
  } catch (e) {
    console.warn(e);
  }

  try {
    let response = await db.retrieve(`get-meter-character.xql?number=${number}&author=${author}`)
    viewParams.meterCharacteristics = response.data;
  } catch (e) {
    console.warn(e);
  }

  res.render('view', viewParams);
}

view.get('/:number/:author/:edition', composeView);

module.exports = view;
