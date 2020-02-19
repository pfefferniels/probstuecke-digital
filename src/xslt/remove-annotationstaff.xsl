<xsl:stylesheet xmlns:mei="http://www.music-encoding.org/ns/mei" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:variable name="nOfAnnotationStaff" select="string(//mei:staffGrp/mei:staffDef[@xml:id='mattheson']/@n)" />

    <xsl:template match="mei:staffGrp/mei:staffDef[@n=$nOfAnnotationStaff]"/>
    <xsl:template match="mei:staff[@n=$nOfAnnotationStaff]"/>
</xsl:stylesheet>
