<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:mei="http://www.music-encoding.org/ns/mei" exclude-result-prefixes="mei">
    <xsl:output method="xml" indent="yes" omit-xml-declaration="no" />
    <xsl:strip-space elements="*" />
    <xsl:template match="node()|@*">
        <xsl:copy>
            <xsl:apply-templates select="node()|@*" />
        </xsl:copy>
    </xsl:template>
    <xsl:template match="mei:measure">
        <xsl:variable name="mnum">
            <xsl:value-of select="@n" />
        </xsl:variable>
        <xsl:copy>
            <xsl:apply-templates select="node()|@*" />
            <xsl:if test="ancestor::mei:mdiv/@n = '2'">
              <xsl:copy-of select="//mei:mdiv[@n = '1']/descendant::mei:measure[@n = $mnum]/mei:harm"/>
            </xsl:if>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
