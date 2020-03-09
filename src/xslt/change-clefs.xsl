<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:mei="http://www.music-encoding.org/ns/mei" version="2.0">

    <xsl:template match="mei:clef[(@shape='C' and @line='4') or (@shape='F' and @line='3')]">
        <xsl:copy>
            <xsl:choose>
                <xsl:when test="$modernClefs = 'on'">
                    <xsl:attribute name='shape'>F</xsl:attribute>
                    <xsl:attribute name='line'>4</xsl:attribute>
               </xsl:when>
                <xsl:otherwise>
                    <xsl:copy-of select="@*" />
                </xsl:otherwise>
          </xsl:choose>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:clef[@shape='C' and (@line='3' or @line='2' or @line='1')]">
        <xsl:copy>
            <xsl:choose>
                <xsl:when test="$modernClefs = 'on'">
                    <xsl:attribute name='shape'>G</xsl:attribute>
                    <xsl:attribute name='line'>2</xsl:attribute>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:copy-of select="@*" />
                </xsl:otherwise>
         </xsl:choose>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:staffDef[(@clef.shape='C' and @clef.line='4') or (@clef.shape='F' and @clef.line='3')]">
        <xsl:copy>
            <xsl:choose>
                <xsl:when test="$modernClefs = 'on'">
                    <xsl:attribute name='clef.shape'>F</xsl:attribute>
                    <xsl:attribute name='clef.line'>4</xsl:attribute>
                    <xsl:copy-of select="@*[local-name() != 'clef.shape' and local-name() != 'clef.line']" />
                    <xsl:copy-of select='./*' />
                </xsl:when>
                <xsl:otherwise>
                    <xsl:copy-of select="node() | @*" />
                </xsl:otherwise>
            </xsl:choose>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:staffDef[@clef.shape='C' and (@clef.line='3' or @clef.line='2' or @clef.line='1')]">
        <xsl:copy>
            <xsl:choose>
                <xsl:when test="$modernClefs = 'on'">
                    <xsl:attribute name='clef.shape'>G</xsl:attribute>
                    <xsl:attribute name='clef.line'>2</xsl:attribute>
                    <xsl:copy-of select="@*[local-name() != 'clef.shape' and local-name() != 'clef.line']" />
                    <xsl:copy-of select='./*' />
                </xsl:when>
                <xsl:otherwise>
                    <xsl:copy-of select="node() | @*" />
                </xsl:otherwise>
            </xsl:choose>
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>
