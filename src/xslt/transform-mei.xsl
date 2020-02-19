<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:mei="http://www.music-encoding.org/ns/mei" version="1.0">

    <xsl:param name="modernClefs"/>
    <xsl:param name="removeAnnotationStaff"/>
    <xsl:param name="stavesAbove"/>
    <xsl:param name="stavesBelow"/>

    <xsl:include href="add-staves.xsl"/>
    <xsl:include href="change-clefs.xsl"/>
    <xsl:include href="remove-annotationstaff.xsl"/>

    <xsl:template match="node() | @*">
        <xsl:copy>
            <xsl:apply-templates select="node() | @*"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
