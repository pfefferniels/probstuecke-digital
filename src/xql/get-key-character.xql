xquery version "3.1";
declare namespace mei="http://www.music-encoding.org/ns/mei";
declare namespace request = "http://exist-db.org/xquery/request";

let $number := request:get-parameter('number', ())
let $label := request:get-parameter('label', ())

let $input := doc('/db/apps/probstuecke-digital/' || $number || '/' || $label || '/score.xml')
let $pname := string($input//mei:scoreDef/@key.pname)
let $accid := string($input//mei:scoreDef/@key.accid)
let $pname := if($accid = 'f') then (
                $pname || 'b'
              ) else if($accid = 's') then (
                $pname || '#'
              ) else (
                $pname
              )
let $mode := string($input//mei:scoreDef/@key.mode)

return doc('/db/apps/probstuecke-digital/tonality/' || $pname || '.' || $mode || '.xml')
