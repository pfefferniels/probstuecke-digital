const express = require('express'),
      bodyParser = require('body-parser'),
      renderRouter = require('./src/js/render.js'),
      iiifRouter = require('./src/js/iiif.js'),
      facsimileRouter = require('./src/js/facsimile.js'),
      viewRouter = require('./src/js/view.js'),
      searchRouter = require('./src/js/search.js')
      indexRouter = require('./src/js/index.js'),
      referencesRouter = require('./src/js/references.js');

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
app.use('/index', indexRouter);
app.use('/references', referencesRouter);
app.use('/search', searchRouter);

app.get('/', function(req, res) {
  res.render('start');
});

app.get('/howto', function(req, res) {
  res.render('howto');
});

app.get('/contributions', function(req, res) {
  res.render('contributions');
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Listening');
});
