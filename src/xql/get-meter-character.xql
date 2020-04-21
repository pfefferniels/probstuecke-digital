xquery version "3.1";
declare namespace mei="http://www.music-encoding.org/ns/mei";
declare namespace request = "http://exist-db.org/xquery/request";

let $number := request:get-parameter('number', ())
let $label := request:get-parameter('label', ())

let $input := doc('/db/apps/probstuecke-digital/' || $number || '/' || $label || '/score.xml')
let $count := string($input//mei:staffDef[1]/mei:meterSig/@count)
let $unit := string($input//mei:staffDef[1]/mei:meterSig/@unit)

return doc('/db/apps/probstuecke-digital/meter/' || $count || '.' || $unit || '.xml')
