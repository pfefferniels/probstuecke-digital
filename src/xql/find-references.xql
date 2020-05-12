xquery version "3.1";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace request = "http://exist-db.org/xquery/request";

let $refId := '#' || xmldb:decode(request:get-parameter('ref', ''))
let $collection := collection("/db/apps/probstuecke-digital")
let $refs := $collection//tei:body//*[@ref=$refId]

return
   <references>
     {
       for $ref in $refs
       return <ref>{base-uri($ref)}</ref>
     }
   </references>
