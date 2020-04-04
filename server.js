const express = require('express'),
      bodyParser = require('body-parser'),
      renderRouter = require('./src/render.js'),
      iiifRouter = require('./src/iiif.js'),
      facsimileRouter = require('./src/facsimile.js'),
      viewRouter = require('./src/view.js'),
      personsRouter = require('./src/persons.js');

// express.js setup
const app = express();
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.set('views', './views');

// parse application/json
app.use(bodyParser.json());

app.use('/render', renderRouter);
app.use('/facsimile', facsimileRouter);
app.use('/view', viewRouter);
app.use('/iiif', iiifRouter);
app.use('/persons', personsRouter);

app.get('/howto', function(req, res) {
  res.render('howto');
});

app.get('/contributions', function(req, res) {
  res.render('contributions');
});

app.get('/', function(req, res) {
  res.redirect('/view/frontpage/mattheson/secondEdition');
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Listening');
});
