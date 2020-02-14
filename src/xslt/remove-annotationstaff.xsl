<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:mei="http://www.music-encoding.org/ns/mei">

    <xsl:template match="@* | node()">
        <xsl:copy>
            <xsl:apply-templates select="@* | node()"/>
        </xsl:copy>
    </xsl:template>

    <!-- removing annotation staff -->
    <xsl:template match="mei:staffDef[@n='1']" />
    <xsl:template match="mei:staff[@n='1']" />

</xsl:stylesheet>
