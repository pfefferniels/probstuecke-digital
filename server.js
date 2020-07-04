const express = require('express'),
      dataRouter = require('./src/js/data.js'),
      iiifRouter = require('./src/js/iiif.js'),
      searchRouter = require('./src/js/search.js')
      referencesRouter = require('./src/js/references.js');

const app = express();

app.use('/data', dataRouter);
app.use('/iiif', iiifRouter);
app.use('/references', referencesRouter);
app.use('/search', searchRouter);

app.listen(process.env.PORT || 3001, function() {
  console.log('Listening');
});
