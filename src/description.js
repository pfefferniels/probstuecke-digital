const path = require('path');

function sendDescription(req, res) {
  if (isNaN(req.query.nr)) {
    console.log("invalid query number passed.");
    res.status("404").end();
  }

  res.sendFile(path.join(__dirname, '../data', req.query.nr, '/description.json'), function(err) {
    if (err) {
      console.log(err);
      res.status("404").end();
      return;
    }
  });
}

exports.sendDescription = sendDescription;
