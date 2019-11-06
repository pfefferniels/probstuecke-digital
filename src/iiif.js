// provide a simple AnnotationList service in the
// recommended URI pattern: /{prefix}/{identifier}/list/{name}

const path = require('path');

function sendAnnotationList(req, res) {
  if (isNaN(req.params.number)) {
    console.log("invalid query number passed.");
    res.status("404").end();
    return;
  }

  res.sendFile(path.join(__dirname, '../data', req.params.number, (req.params.name+'.json')), function(err) {
    if (err) {
      console.log(err);
      res.status("404").end();
      return;
    }
  });
}

exports.sendAnnotationList = sendAnnotationList;
