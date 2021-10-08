<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:mei="http://www.music-encoding.org/ns/mei" version="3.0">
    <xsl:template match="mei:clef[(@shape='C' and @line='4') or (@shape='F' and @line='3')]">
        <xsl:copy>
                    <xsl:attribute name="shape">F</xsl:attribute>
                    <xsl:attribute name="line">4</xsl:attribute>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:clef[@shape='C' and (@line='3' or @line='2' or @line='1')]">
        <xsl:copy>
                    <xsl:attribute name="shape">G</xsl:attribute>
                    <xsl:attribute name="line">2</xsl:attribute>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:staffDef[(@clef.shape='C' and @clef.line='4') or (@clef.shape='F' and @clef.line='3')]">
        <xsl:copy>
                    <xsl:attribute name="clef.shape">F</xsl:attribute>
                    <xsl:attribute name="clef.line">4</xsl:attribute>
                    <xsl:apply-templates select="@*[local-name() != 'clef.shape' and local-name() != 'clef.line']"/>
                    <xsl:apply-templates select="*"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:staffDef[@clef.shape='C' and (@clef.line='3' or @clef.line='2' or @clef.line='1')]">
        <xsl:copy>
                    <xsl:attribute name="clef.shape">G</xsl:attribute>
                    <xsl:attribute name="clef.line">2</xsl:attribute>
                    <xsl:apply-templates select="@*[local-name() != 'clef.shape' and local-name() != 'clef.line']"/>
                    <xsl:apply-templates select="./*"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="node() | @*">
        <xsl:copy>
            <xsl:apply-templates select="node() | @*"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
