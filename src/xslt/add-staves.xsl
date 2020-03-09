<xsl:stylesheet xmlns:mei="http://www.music-encoding.org/ns/mei" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

    <!-- adding staves above -->
    <xsl:template match="mei:staffGrp">
        <xsl:apply-templates select="@*" />
        <xsl:copy>
            <xsl:for-each select="1 to $stavesAbove">
                <xsl:variable name="i" select="."/>
                <staffDef n="{$i+10}" lines="5"/>
            </xsl:for-each>
            <xsl:apply-templates />
            <xsl:for-each select="1 to $stavesBelow">
                <xsl:variable name="i" select="."/>
                <staffDef n="{$i+20}" lines="5"/>
            </xsl:for-each>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:measure">
        <xsl:copy>
            <xsl:copy-of select="@*" />
            <xsl:for-each select="1 to $stavesAbove">
                <xsl:variable name="i" select="."/>
                <staff n="{$i+10}">
                    <layer n="1">
                        <mSpace/>
                    </layer>
                </staff>
            </xsl:for-each>
            <xsl:apply-templates />
            <xsl:for-each select="1 to $stavesBelow">
                <xsl:variable name="i" select="."/>
                <staff n="{$i+20}">
                    <layer n="1">
                        <mSpace/>
                    </layer>
                </staff>
            </xsl:for-each>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
