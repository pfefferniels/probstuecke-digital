A critical digital edition of the 24 Probstücke (test pieces) by Johann Mattheson
from the Große Generalbassschule (1719/1731). The edition is available at
<http://probstuecke-digital.de>.

Requirements
------------
- [Node.js](nodejs.org)
- [eXist-db](http://exist-db.org/)

Installation
------------

1. `git clone https://github.com/pfefferniels/probstuecke-digital`
2. Adapt `existConfig.json.template` to your eXist-db configuration and rename it to `existConfig.json`
3. `gulp deploy`
4. `npm install`
5. `npm start` and open `localhost:3000` in the browser.
