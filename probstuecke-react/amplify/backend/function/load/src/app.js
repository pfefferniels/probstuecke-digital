/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/
const db = require('./db.js'),
      express = require('express'),
      bodyParser = require('body-parser'),
      awsServerlessExpressMiddleware = require('aws-serverless-express/middleware'),
      dataRouter = require('./data.js'),
      iiifRouter = require('./iiif.js'),
      searchRouter = require('./search.js'),
      referencesRouter = require('./references.js');

var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

app.use('/load/data', dataRouter);
app.use('/load/iiif', iiifRouter);
app.use('/load/references', referencesRouter);
app.use('/load/search', searchRouter);

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
