xquery version "3.1";

module namespace api = "http://probstuecke-digital.de/ns/exist/api";

declare namespace rest = "http://exquery.org/ns/restxq";
declare namespace http = "http://expath.org/ns/http-client";
declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";
declare namespace repo = "http://exist-db.org/xquery/repo";
declare namespace expath = "http://expath.org/ns/pkg";
declare namespace json = "http://www.w3.org/2013/XSL/json";
declare namespace tei = "http://www.tei-c.org/ns/1.0";
declare namespace mei="http://www.music-encoding.org/ns/mei";
declare namespace jsn = "http://www.json.org";
declare namespace test = "http://exist-db.org/xquery/xqsuite";
declare namespace rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
declare namespace transform = "http://exist-db.org/xquery/transform";
declare namespace xmldb = "http://exist-db.org/xquery/xmldb";
import module namespace kwic="http://exist-db.org/xquery/kwic";

declare function api:getRegion($zones as element()+) as xs:string {
    let $x := min($zones/xs:integer(@ulx))
    let $y := min($zones/xs:integer(@uly))
    let $x2 := max($zones/xs:integer(@lrx))
    let $y2 := max($zones/xs:integer(@lry))
    let $w := $x2 - $x
    let $h := $y2 - $y

    return $x || ',' || $y || ',' || $w || ',' || $h
};

declare function api:pad-string-to-length
  ( $stringToPad as xs:string? ,
     $length as xs:integer )  as xs:string {

    let $tmp := concat('000000', $stringToPad)
    return substring($tmp, string-length($tmp)-$length+1)
};


(:~ CORS header :)
declare function api:enable_cors() {
    <rest:response>
        <http:response>
            <http:header name="Access-Control-Allow-Origin" value="*"/>
        </http:response>
    </rest:response>
};

(:~
 : API info
 :
 : Shows version numbers of probstuecke-digital and the underlying eXist-db.
 :
 : @result XML object
 :)
declare
  %rest:GET
  %rest:path("/info")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:info() {
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
    (: TODO generate toc.json :)
    (api:enable_cors(),
    json-doc("/db/apps/probstuecke-digital/encodings/toc.json"))
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
  %rest:path("/tei")
  %rest:query-param("path", "{$path}")
  %rest:query-param("modernize", "{$modernize}")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:tei($path, $modernize) {
  let $newPath := (
    if ($modernize = "1") then (
      (fn:substring-before($path, ".") || "-modernized.xml")
    ) else (
      $path
    )
  )

  let $input := doc("/db/apps/probstuecke-digital/encodings/" || $newPath)

  return (
    if ($modernize = "1") then (
      let $xsl := doc("/db/apps/probstuecke-digital/xslt/modernize-tei.xsl")
      return (api:enable_cors(), transform:transform($input, $xsl, ()))
    ) else (
      (api:enable_cors(), $input)
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
  %rest:path("/mei")
  %rest:query-param("path", "{$path}")
  %rest:query-param("stavesAbove", "{$stavesAbove}", '0')
  %rest:query-param("stavesBelow", "{$stavesBelow}", '0')
  %rest:query-param("modernClefs", "{$modernClefs}", "on")
  %rest:query-param("removeAnnotationStaff", "{$removeAnnotationStaff}", "on")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:mei($path, $stavesAbove, $stavesBelow, $modernClefs, $removeAnnotationStaff) {
  let $stavesAbove := if ($stavesAbove) then ($stavesAbove) else (())
  let $stavesBelow := if ($stavesBelow) then ($stavesBelow) else (())
  let $modernClefs := if ($modernClefs) then ($modernClefs) else ('off')
  let $removeAnnotationStaff := if ($removeAnnotationStaff) then ($removeAnnotationStaff) else ('on')

  let $input := doc("/db/apps/probstuecke-digital/encodings/" || $path)

  let $formatFb := doc('/db/apps/probstuecke-digital/xslt/format-fb.xsl')
  let $removeAnnotStaff := doc('/db/apps/probstuecke-digital/xslt/remove-annotationstaff.xsl')
  let $addStaves := doc('/db/apps/probstuecke-digital/xslt/add-staves.xsl')
  let $modernizeClefs := doc('/db/apps/probstuecke-digital/xslt/change-clefs.xsl')

  let $stage0 := transform:transform($input, $formatFb,
    <parameters>
    </parameters>)

  let $stage1 := if ($removeAnnotationStaff eq 'on') then transform:transform($stage0, $removeAnnotStaff,
    <parameters>
    </parameters>) else ($stage0)

  let $stage2 := if ($modernClefs eq 'on') then transform:transform($stage1, $modernizeClefs,
    <parameters></parameters>) else ($stage1)

  let $stage3 := if ($stavesAbove) then transform:transform($stage2, $addStaves,
    <parameters>
      <param name="stavesAbove" value="{$stavesAbove}" />
      <param name="stavesBelow" value="{$stavesBelow}" />
    </parameters>) else ($stage2)

  return (api:enable_cors(), $stage3)
};

(:~
 : Media
 :
 : Streams media elements
 :
 : @result binary object
 :)
declare
  %rest:GET
  %rest:path("/media")
  %rest:query-param("path", "{$path}")
  %output:method('binary')
function api:media($path) {
  (api:enable_cors(),
    util:binary-doc("/db/apps/probstuecke-digital/encodings/" || $path))
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
  %rest:path("/iiif")
  %rest:query-param("path", "{$path}")
  %rest:produces("application/json")
  %output:media-type("application/json")
  %output:method("json")
function api:iiif($path) {
  (api:enable_cors(), json-doc("/db/apps/probstuecke-digital/" || $path))
};


(:~
 : References
 :
 : Returns in-text references for a given person, place, work ...
 :
 : @result XML object
 :)
declare
  %rest:GET
  %rest:path("/references/{$ref}")
  %rest:produces("application/xml")
  %output:media-type("application/xml")
  %output:method("xml")
function api:references($ref) {
  let $refId := '#' || xmldb:decode($ref)
  let $collection := collection("/db/apps/probstuecke-digital")
  let $refs :=
    for $ref in $collection//tei:body//*[@corresp=$refId]
    return base-uri($ref)


  return
     (api:enable_cors(),
     map {
       'references': $refs
     })
};


(:~
 : Search for a given string
 :
 : Returns search results
 :
 : @result JSON object
 :)
declare
  %rest:GET
  %rest:path("/search/{$query}")
  %rest:produces("application/json")
  %output:media-type("application/json")
  %output:method("json")
function api:search($query) {
  let $q := xmldb:decode($query) || '~0.8'
  let $collection := collection("/db/apps/probstuecke-digital")[not(contains(util:document-name(.), '_en') or contains(util:document-name(.), 'modernized'))]

  let $results :=
    for $p in $collection//tei:body//tei:p[ft:query(., $q)]
    order by ft:score($p) descending
        return
            map {
                'title': string(fn:head(root($p)//tei:titleStmt/tei:title)),
                'summary': kwic:summarize($p, <config width="150"/>)
            }

  return (api:enable_cors(),
   map {
       'results': $results
   })
};


(:~
 : TEI Facsimile
 :
 : Returns TEI facsimile zones
 :
 : @result JSON object
 :)
declare
  %rest:GET
  %rest:path("/tei-facsimile")
  %rest:query-param("path", "{$path}")
  %rest:produces("application/json")
  %output:media-type("application/json")
  %output:method("json")
function api:tei-facsimile($path) {
    let $doc := doc("/db/apps/probstuecke-digital/encodings/" || $path)
    let $zones :=
        for $zone in $doc//tei:zone
        let $url := $zone/../tei:graphic/@url/string()
        let $id := $zone/@xml:id/string()
        let $region := api:getRegion($zone)

        let $url.tokens := tokenize($url, "/")
        let $identifier := $url.tokens[7]
        let $canvas.id := xs:string(xs:integer($url.tokens[9])-16)
        let $scan.id := api:pad-string-to-length($canvas.id, 5)

        return map {
            'id': $id,
            'imageApiUrl': 'https://api.digitale-sammlungen.de/iiif/image/v2/' || $identifier || '_' || $scan.id || '/' || $region || '/pct:50/0/color.jpg'
        }

    return (
        api:enable_cors(),
        map {
            'zones': array { $zones }
        })
};

(:~
 : MEI Facsimile
 :
 : Returns MEI facsimile zones
 :
 : @result JSON object
 :)
declare
  %rest:GET
  %rest:path("/mei-facsimile")
  %rest:query-param("path", "{$path}")
  %rest:produces("application/json")
  %output:media-type("application/json")
  %output:method("json")
function api:mei-facsimile($path) {
    let $doc := doc("/db/apps/probstuecke-digital/encodings/" || $path)

    let $facsElements :=
        for $el in $doc//*[@facs]
        let $elId := $el/@xml:id/string()
        let $facsRefs := tokenize(normalize-space($el/@facs/string()),' ')

        let $zones :=
            if (count($facsRefs) > 0 and count($el[@xml:id]) > 0)
            then (
            for $facsRef in $facsRefs
            let $ref := substring($facsRef, 2)
            let $zone := $doc//mei:zone[@xml:id=$ref]
            let $url := $zone/../mei:graphic/@target/string()
            let $id := $zone/@xml:id/string()
            let $region := api:getRegion($zone)

            let $url.tokens := tokenize($url, "/")
            let $identifier := $url.tokens[7]
            let $canvas.id := xs:string(xs:integer($url.tokens[9])-16)
            let $scan.id := api:pad-string-to-length($canvas.id, 5)

            return 'https://api.digitale-sammlungen.de/iiif/image/v2/' || $identifier || '_' || $scan.id || '/' || $region || '/pct:50/0/color.jpg')
            else ()

        return map {
            'id': $elId,
            'imageApiUrl': array { $zones }
        }

    return (
        api:enable_cors(),
        map {
            'zones': array { $facsElements }
        })
};
