const path = require('path');

// prevent possible dot-dot-slash attacks
function preventDotDotSlash(userInput) {
  return path.parse(userInput).base;
}

function getAnnotationFilename(nr, lang) {
  return path.join(__dirname, "../data", nr, "annotations_"+lang+".tei");
}

exports.preventDotDotSlash = preventDotDotSlash;
exports.getAnnotationFilename = getAnnotationFilename;
