const utils = require('./utils.js');

function sendAnnotations(req, res) {
  // make sure req.query.nr is indeed a number
  if (isNaN(req.query.nr)) {
    console.log("invalid query number passed.");
    res.status("404");
  }

  res.sendFile(utils.getAnnotationFilename(req.query.nr, utils.preventDotDotSlash(req.query.lang)), {}, function(err) {
    if (err) {
      console.log(err.status);
      res.status("404").end();
    }
  });
}

exports.sendAnnotations = sendAnnotations;
