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
                <staffDef n="{$i+10}" lines="5">
                    <xsl:copy-of select="$meterSig"/>
                </staffDef>
            </xsl:for-each>
            <xsl:apply-templates/>
            <xsl:for-each select="1 to $stavesBelow">
                <xsl:variable name="i" select="."/>
                <staffDef n="{$i+20}" lines="5">
                    <xsl:copy-of select="$meterSig"/>
                </staffDef>
            </xsl:for-each>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:measure">
        <xsl:copy>
            <xsl:apply-templates select="@*"/>
            <xsl:for-each select="1 to $stavesAbove">
                <xsl:variable name="i" select="."/>
                <staff n="{$i+10}">
                    <layer n="1">
                        <mSpace/>
                    </layer>
                </staff>
            </xsl:for-each>
            <xsl:apply-templates select="*"/>
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

  <xsl:template match="*">
    <xsl:element name="{local-name(.)}">
      <xsl:apply-templates select="@* | node()"/>
    </xsl:element>
  </xsl:template>
  <xsl:template match="@*">
    <xsl:attribute name="{local-name(.)}">
      <xsl:value-of select="."/>
    </xsl:attribute>
  </xsl:template>

  <!--
    The above template removes namespace prefixes, that eXist seems
    to introduce, while other XSLT processors don't. Usually, a normal
    identity template should be sufficient.

    <xsl:template match="node() | @*">
        <xsl:copy>
            <xsl:apply-templates select="node() | @*"/>
        </xsl:copy>
    </xsl:template>-->
</xsl:stylesheet>
