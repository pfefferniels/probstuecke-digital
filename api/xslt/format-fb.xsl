<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:mei="http://www.music-encoding.org/ns/mei" version="3.0">

    <!-- This stylesheet transforms figures in "normal" unicode
    into there SMUFL equivalents. -->

    <xsl:template match="mei:f/text()">
        <xsl:choose>
            <xsl:when test="contains(., '2')">
                <xsl:value-of select="replace(., '2', '')" />
            </xsl:when>
            <xsl:when test="contains(., '3')">
                <xsl:value-of select="replace(., '3', '')" />
            </xsl:when>
            <xsl:when test="contains(., '4+')">
                <xsl:value-of select="replace(., '4+', '')" />
            </xsl:when>
            <xsl:when test="contains(., '4')">
                <xsl:value-of select="replace(., '4', '')" />
            </xsl:when>
            <xsl:when test="contains(., '5')">
                <xsl:value-of select="replace(., '5', '')" />
            </xsl:when>
            <xsl:when test="contains(., '6⃥')">
                <xsl:value-of select="replace(., '6⃥', '')" />
            </xsl:when>
            <xsl:when test="contains(., '6')">
                <xsl:value-of select="replace(., '6', '')" />
            </xsl:when>
            <xsl:when test="contains(., '7')">
                <xsl:value-of select="replace(., '7', '')" />
            </xsl:when>
            <xsl:when test="contains(., '8')">
                <xsl:value-of select="replace(., '8', '')" />
            </xsl:when>
            <xsl:when test="contains(., '9')">
                <xsl:value-of select="replace(., '9', '')" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="."/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="node() | @*">
        <xsl:copy>
            <xsl:apply-templates select="node() | @*"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
