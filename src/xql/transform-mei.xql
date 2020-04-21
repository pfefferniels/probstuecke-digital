xquery version "3.1";

declare namespace transform = "http://exist-db.org/xquery/transform";
declare namespace request = "http://exist-db.org/xquery/request";

let $input := request:get-parameter('input', ())
let $stavesAbove := request:get-parameter('stavesAbove', ())
let $stavesBelow := request:get-parameter('stavesBelow', ())
let $modernClefs := request:get-parameter('modernClefs', ())
let $removeAnnotationStaff := request:get-parameter('removeAnnotationStaff', ())

let $xsl := doc('/db/apps/probstuecke-digital/transform-mei.xsl')

return transform:transform(doc($input), $xsl,
  <parameters>
    <param name="stavesAbove" value="{$stavesAbove}" />
    <param name="stavesBelow" value="{$stavesBelow}" />
    <param name="modernClefs" value="{$modernClefs}" />
    <param name="removeAnnotationStaff" value="{$removeAnnotationStaff}" />
  </parameters>)
