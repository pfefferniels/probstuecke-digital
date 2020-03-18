<xsl:stylesheet xmlns:mei="http://www.music-encoding.org/ns/mei" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:variable name="nOfAnnotationStaff">
        <xsl:choose>
            <xsl:when test="$removeAnnotationStaff = 'on'">
                <xsl:value-of select="string(//mei:staffGrp/mei:staffDef[@type='embeddedAnnotation']/@n)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="-1"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>

    <xsl:variable name="nOfAnnotationLayer">
        <xsl:choose>
            <xsl:when test="$removeAnnotationStaff = 'on'">
                <xsl:value-of select="string(//mei:layerDef[@type='embeddedAnnotation']/@n)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="-1"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>


    <xsl:template match="mei:staffDef[@n=$nOfAnnotationStaff]"/>
    <xsl:template match="mei:layerDef[@n=$nOfAnnotationLayer]"/>
    <xsl:template match="mei:staff[@n=$nOfAnnotationStaff]"/>
    <xsl:template match="mei:layer[@n=$nOfAnnotationLayer]"/>

</xsl:stylesheet>
