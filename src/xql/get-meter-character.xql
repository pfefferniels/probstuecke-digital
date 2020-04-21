xquery version "3.1";
declare namespace mei="http://www.music-encoding.org/ns/mei";
declare namespace request = "http://exist-db.org/xquery/request";

let $number := request:get-parameter('number', ())
let $author := request:get-parameter('author', ())

let $input := doc('/db/apps/probstuecke-digital/' || $number || '/' || $author || '/score.xml')
let $count := string($input//mei:staffDef[1]/mei:meterSig/@count)
let $unit := string($input//mei:staffDef[1]/mei:meterSig/@unit)

return doc('/db/apps/probstuecke-digital/meter/' || $count || '.' || $unit || '.xml')
