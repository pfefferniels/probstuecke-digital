const exist = require('@existdb/node-exist'),
      existConfig = require('../existConfig.json'),
      db = exist.connect(existConfig);

function parseMEI(number, label, file, options) {
  let queryParams = {
    variables: {
      input: ['/db/apps/probstuecke-digital', number, label, file].join('/'),
      stavesAbove: 0,
      stavesBelow: 0,
      modernClefs: false,
      removeAnnotationStaff: true
    }
  }

  if (options.above) {
    queryParams.variables.stavesAbove = options.above;
  }

  if (options.below) {
    queryParams.variables.stavesBelow = options.below;
  }

  options.showAnnotationStaff == 'on' ?
    queryParams.variables.removeAnnotationStaff = 'off' :
    queryParams.variables.removeAnnotationStaff = 'on';

  if (options.modernClefs) {
    queryParams.variables.modernClefs = options.modernClefs;
  }

  return db.queries.readAll(`
      xquery version "3.1";
      declare namespace transform="http://exist-db.org/xquery/transform";

      let $xsl := doc('/db/apps/probstuecke-digital/transform-mei.xsl')
      return transform:transform(doc($input), $xsl,
      <parameters>
        <param name="stavesAbove" value="{$stavesAbove}" />
        <param name="stavesBelow" value="{$stavesBelow}" />
        <param name="modernClefs" value="{$modernClefs}" />
        <param name="removeAnnotationStaff" value="{$removeAnnotationStaff}" />
      </parameters>)`, queryParams);
}

module.exports.parseMEI = parseMEI;
