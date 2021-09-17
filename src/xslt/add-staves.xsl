<xsl:stylesheet xmlns:mei="http://www.music-encoding.org/ns/mei" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"  exclude-result-prefixes="mei">
    <xsl:param name="stavesAbove"/>
    <xsl:param name="stavesBelow"/>

    <!-- adding staves above -->
    <xsl:template match="mei:staffGrp">
        <xsl:copy>
            <xsl:apply-templates select="@*"/>
            <xsl:variable name="meterSig" select="//mei:staffDef[1]/mei:meterSig"/>

            <xsl:for-each select="1 to $stavesAbove">
                <xsl:variable name="i" select="."/>
                
                <xsl:element name="staffDef" xmlns="http://www.music-encoding.org/ns/mei">
                    <xsl:attribute name="n">
                        <xsl:value-of select="$i+10" />
                    </xsl:attribute>
                    <xsl:attribute name="lines">5</xsl:attribute>
                    
                    <xsl:copy-of select="$meterSig"/>
                </xsl:element>
            </xsl:for-each>
            
            <xsl:apply-templates/>
            
            <xsl:for-each select="1 to $stavesBelow">
                <xsl:variable name="i" select="."/>
                <xsl:element name="staffDef" xmlns="http://www.music-encoding.org/ns/mei">
                    <xsl:attribute name="n">
                        <xsl:value-of select="$i+20" />
                    </xsl:attribute>
                    <xsl:attribute name="lines">5</xsl:attribute>
                    
                    <xsl:copy-of select="$meterSig"/>
                </xsl:element>
            </xsl:for-each>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:measure">
        <xsl:copy>
            <xsl:apply-templates select="@*"/>
            <xsl:for-each select="1 to $stavesAbove">
                <xsl:variable name="i" select="."/>
                
                <xsl:element name="staff" xmlns="http://www.music-encoding.org/ns/mei">
                    <xsl:attribute name="n">
                        <xsl:value-of select="$i+10" />
                    </xsl:attribute>
                    
                    <xsl:element name="layer" xmlns="http://www.music-encoding.org/ns/mei">
                        <xsl:attribute name="n">1</xsl:attribute>
                        
                        <xsl:element name="mSpace" xmlns="http://www.music-encoding.org/ns/mei" />
                    </xsl:element>
                </xsl:element>
            </xsl:for-each>
            
            <xsl:apply-templates select="*"/>
            
            <xsl:for-each select="1 to $stavesBelow">
                <xsl:variable name="i" select="."/>
                <xsl:element name="staff" xmlns="http://www.music-encoding.org/ns/mei">
                    <xsl:attribute name="n">
                        <xsl:value-of select="$i+20" />
                    </xsl:attribute>
                    
                    <xsl:element name="layer" xmlns="http://www.music-encoding.org/ns/mei">
                        <xsl:attribute name="n">1</xsl:attribute>
                        
                        <xsl:element name="mSpace" xmlns="http://www.music-encoding.org/ns/mei" />
                    </xsl:element>
                </xsl:element>
            </xsl:for-each>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="node() | @*">
        <xsl:copy>
            <xsl:apply-templates select="node() | @*"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
