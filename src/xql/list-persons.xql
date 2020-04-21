xquery version "3.1";
declare namespace tei="http://www.tei-c.org/ns/1.0";

for $persName in collection('/db/apps/probstuecke-digital/')//tei:body//tei:persName[@ref]
let $place := <location>{substring-after(base-uri($persName), "probstuecke-digital/")}</location>
order by $persName/@ref
group by $persName

return <person>{$persName}<locations>{$place}</locations></person>
