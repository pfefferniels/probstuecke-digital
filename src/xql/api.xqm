xquery version "3.1";

module namespace api = "http://dracor.org/ns/exist/api";

declare namespace rest = "http://exquery.org/ns/restxq";
declare namespace http = "http://expath.org/ns/http-client";
declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";
declare namespace repo = "http://exist-db.org/xquery/repo";
declare namespace expath = "http://expath.org/ns/pkg";
declare namespace json = "http://www.w3.org/2013/XSL/json";
declare namespace tei = "http://www.tei-c.org/ns/1.0";
declare namespace jsn = "http://www.json.org";
declare namespace test = "http://exist-db.org/xquery/xqsuite";
declare namespace rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
declare namespace transform = "http://exist-db.org/xquery/transform";


(:~
 : API info
 :
 : Shows version numbers of probstuecke-digital and the underlying eXist-db.
 :
 : @result XML object
 :)
declare
  %rest:GET
  %rest:path("/info2")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:info2() {
    <info>
        <name>Probstücke API</name>
        <version>0.1</version>
    </info>
};


(:~
 : Table of Contents
 :
 : Returns the table of contents, including the available encodings
 : for each Probstück and an incipit in PAE encoding.
 :
 : @result JSON object
 :)
declare
  %rest:GET
  %rest:path("/toc")
  %rest:produces("application/json")
  %output:media-type("application/json")
  %output:method("json")
function api:toc() {
    json-doc("/db/apps/probstuecke-digital/encodings/toc.json")
};

(:~
 : Guidelines
 :
 : Returns the TEI and MEI encoding guidelines.
 :
 : @result XML object
 :)
declare
  %rest:GET
  %rest:path("/guidelines")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:guidelines() {
    doc("/db/apps/probstuecke-digital/encodings/guidelines/guidelines_en.xml")
};

(:~
 : Indices
 :
 : Returns the TEI for a given index (musical works, persons ...)
 : following the ediarum.REGISTER specification.
 :
 : @result XML object
 :)
declare
  %rest:GET
  %rest:path("/indices/{$file}")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:indices($file) {
    doc("/db/apps/probstuecke-digital/encodings/indices/" || ($file))
};

(:~
 : TEI
 :
 : Returns the TEI at a given path
 :
 : @result XML object
 :)
declare
  %rest:GET
  %rest:path("/tei/{$number}/{$author}/{$file}")
  %rest:query-param("modernize", "{$modernize}")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:tei($number, $author, $file, $modernize) {
  let $input := doc("/db/apps/probstuecke-digital/encodings/" || ($number) || "/" || ($author) || "/" || (
    if ($modernize = '1') then (
      (fn:substring-before($file, ".") || "-modernized.xml")
    ) else (
      $file
    )))
  let $xsl := doc('/db/apps/probstuecke-digital/xslt/modernize-tei.xsl')

  return (
    if ($modernize = '1') then (
      transform:transform($input, $xsl, ())
    ) else (
      $input
    )
  )
};

(:~
 : MEI
 :
 : Returns the MEI at a given path
 :
 : @result XML object
 :)
declare
  %rest:GET
  %rest:path("/mei/{$number}/{$author}/{$file}")
  %rest:query-param("stavesAbove", "{$stavesAbove}", '0')
  %rest:query-param("stavesBelow", "{$stavesBelow}", '0')
  %rest:query-param("modernClefs", "{$modernClefs}", "on")
  %rest:query-param("removeAnnotationStaff", "{$removeAnnotationStaff}", "on")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:mei($number, $author, $file, $stavesAbove, $stavesBelow, $modernClefs, $removeAnnotationStaff) {
  let $stavesAbove := if ($stavesAbove) then ($stavesAbove) else (())
  let $stavesBelow := if ($stavesBelow) then ($stavesBelow) else (())
  let $modernClefs := if ($modernClefs) then ($modernClefs) else ('off')
  let $removeAnnotationStaff := if ($removeAnnotationStaff) then ($removeAnnotationStaff) else ('on')

  let $input := doc("/db/apps/probstuecke-digital/encodings/" || ($number) || "/" || ($author) || "/" || ($file))
  let $xsl := doc('/db/apps/probstuecke-digital/xslt/transform-mei.xsl')

  return transform:transform($input, $xsl,
    <parameters>
      <param name="stavesAbove" value="{$stavesAbove}" />
      <param name="stavesBelow" value="{$stavesBelow}" />
      <param name="modernClefs" value="{$modernClefs}" />
      <param name="removeAnnotationStaff" value="{$removeAnnotationStaff}" />
    </parameters>)
  };


  (:~
   : IIIF Annotations
   :
   : Returns IIIF annotations for a given Probstück
   :
   : @result JSON object
   :)
  declare
    %rest:GET
    %rest:path("/iiif/{$number}/{$author}/{$name}")
    %rest:produces("application/json")
    %output:media-type("application/json")
    %output:method("json")
  function api:iiif($number as xs:integer, $author, $name) {
    json-doc("/db/apps/probstuecke-digital/" || ($number) || "/" || ($author) || "/" || ($name))
  };
