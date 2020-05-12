xquery version "3.1";
declare namespace tei="http://www.tei-c.org/ns/1.0";
declare namespace request = "http://exist-db.org/xquery/request";
import module namespace kwic="http://exist-db.org/xquery/kwic";

let $q := xmldb:decode(request:get-parameter('q', '')) || '~0.8'
let $collection := collection("/db/apps/probstuecke-digital")

return
 <ul>
 {
  for $p in $collection//tei:body//tei:p[ft:query(., $q)]
  order by ft:score($p) descending
      return
          <li class='result'>
              <span class='result-title'>
                {string(fn:head(root($p)//tei:titleStmt/tei:title))}
              </span>
              {kwic:summarize($p, <config width="100"/>)}
          </li>
  }
  </ul>
