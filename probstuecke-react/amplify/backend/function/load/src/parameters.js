const urlfy = obj => Object
    .keys(obj)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
    .join('&');

function serialize(number, author, file, options) {
  let newOptions = {
      input: ['/db/apps/probstuecke-digital', number, author, file].join('/'),
      stavesAbove: 0,
      stavesBelow: 0,
      modernClefs: false,
      removeAnnotationStaff: true
  }

  if (options.above) {
    newOptions.stavesAbove = options.above;
  }

  if (options.below) {
    newOptions.stavesBelow = options.below;
  }

  options.showAnnotationStaff == 'on' ?
    newOptions.removeAnnotationStaff = 'off' :
    newOptions.removeAnnotationStaff = 'on';

  if (options.modernClefs) {
    newOptions.modernClefs = options.modernClefs;
  }

  return urlfy(newOptions);
}

function serialize2(number,author,file) {
  return urlfy({
    input: ['/db/apps/probstuecke-digital', number, author, file].join('/')
  })
}

module.exports.serialize = serialize;
module.exports.serialize2 = serialize2;
