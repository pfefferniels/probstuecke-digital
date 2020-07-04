<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" version="3.0" exclude-result-prefixes="#all" expand-text="yes">

  <xsl:strip-space elements="*"/>

  <xsl:param name="sep" as="xs:string">-</xsl:param>
  <xsl:param name="pattern" as="xs:string" select="'(' || $sep || ')' || '(\s*)$'"/>

  <xsl:mode on-no-match="shallow-copy"/>

  <xsl:template match="tei:p//text()[matches(., $pattern)][following-sibling::node()[1][self::tei:lb]]" priority="9">
    <xsl:value-of select="replace(., $pattern, '')"/>
    <tei:pc force="{if (following-sibling::node()[2][self::text()[matches(., '^\p{Lu}')]]) then 'strong' else 'weak'}">{$sep}</tei:pc>
  </xsl:template>

   <xsl:template match="tei:body//text()">
       <xsl:analyze-string select="." regex="(ſ)|(oͤ)|(uͤ)|(-\s*$)">
           <xsl:matching-substring>
             <xsl:choose>
               <xsl:when test="matches(.,'ſ')">
                        <tei:g type="long-s">ſ</tei:g>
                    </xsl:when>
               <xsl:when test="matches(.,'oͤ')">
                 <tei:g type="umlaut-o">oͤ</tei:g>
               </xsl:when>
               <xsl:when test="matches(.,'uͤ')">
                 <tei:g type="umlaut-u">uͤ</tei:g>
               </xsl:when>
             </xsl:choose>
           </xsl:matching-substring>
           <xsl:non-matching-substring>
              <xsl:value-of select="."/>
           </xsl:non-matching-substring>
       </xsl:analyze-string>
   </xsl:template>
</xsl:stylesheet>
