const express = require('express'),
      bodyParser = require('body-parser'),
      annotate = require('./routers/annotate.js'),
      renderRouter = require('./routers/render.js'),
      iiifRouter = require('./routers/iiif.js'),
      facsimileRouter = require('./routers/facsimile.js'),
      transcriptionRouter = require('./routers/transcription.js');

// express.js setup
const app = express();
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.set('views', './views');

// parse application/json
app.use(bodyParser.json());

app.use('/render', renderRouter);
app.use('/facsimile', facsimileRouter);
app.use('/transcription', transcriptionRouter);
app.use('/iiif', iiifRouter);

app.get('/_annotate', function(req, res) {
  res.render('annotateFacsimile');
});
app.post('/annotateFile', annotate.annotateFile);
app.get('/annotatedFile', annotate.annotatedFile);

app.get('/', function(req, res) {
  res.render('frontpage');
});

app.get('/howto', function(req, res) {
  res.render('howto');
});

app.get('/guidelines', function(req, res) {
  res.render('guidelines');
});

app.get('/contributions', function(req, res) {
  res.render('contributions');
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Listening');
});
