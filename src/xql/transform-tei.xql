xquery version "3.1";

declare namespace transform = "http://exist-db.org/xquery/transform";
declare namespace request = "http://exist-db.org/xquery/request";

let $input := request:get-parameter('input', ())

let $xsl := doc('/db/apps/probstuecke-digital/transform-tei.xsl')

return transform:transform(doc($input), $xsl,
  <parameters>
  </parameters>)
