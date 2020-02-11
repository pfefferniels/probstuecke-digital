<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:mei="http://www.music-encoding.org/ns/mei">

    <xsl:param name="stavesAbove" />
    <xsl:param name="stavesBelow" />

    <xsl:template match="@* | node()">
        <xsl:copy>
            <xsl:apply-templates select="@* | node()"/>
        </xsl:copy>
    </xsl:template>

    <!-- adding staves above -->
    <xsl:template match="mei:staffGrp">
        <xsl:copy>
            <xsl:for-each select="1 to $stavesAbove">
                <xsl:variable name="i" select="." />
                <staffDef n="{$i+10}" lines="5" />
            </xsl:for-each>
            <xsl:copy-of select="./*" />
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:measure">
        <xsl:copy>
            <xsl:for-each select="1 to $stavesAbove">
                <xsl:variable name="j" select="."/>
                <staff n="{$j+10}">
                    <layer n="1">
                        <mSpace />
                    </layer>
                </staff>
            </xsl:for-each>

            <xsl:copy-of select="./*" />
        </xsl:copy>
    </xsl:template>

    <!-- adding staves below -->

    <!-- removing annotation staff -->

    <!-- exchanging clefs -->


</xsl:stylesheet>
