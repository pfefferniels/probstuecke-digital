'use client'

import type { ReactNode } from 'react'
import { Box, Link, Typography } from '@mui/material'
import { CitationBox } from './CitationBox'
import { expressionCitation, joinNames } from '@/lib/citation'
import { siteMetadata } from '@/lib/siteMetadata'
import type { EditionVersion, Expression } from '@/lib/types'

interface SourcePanelProps {
    expression: Expression
    version: EditionVersion
}

const Row = ({ label, children }: { label: string, children: ReactNode }) => (
    <>
        <Typography component="dt" variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography component="dd" variant="body2" sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Typography>
    </>
)

const Sep = () => <span style={{ color: 'gray', margin: '0 0.4rem' }}>·</span>

/**
 * Describes the text shown on a piece page: its source, the copy used,
 * the people responsible, the licence and how to cite it.
 */
export const SourcePanel = ({ expression, version }: SourcePanelProps) => {
    const { header, sourcePath } = expression
    const editors = header.editors.filter(e => e.role !== 'translator').map(e => e.name)
    const translators = header.editors.filter(e => e.role === 'translator').map(e => e.name)
    const githubFile = `${siteMetadata.dataRepository}/blob/${version.commit ?? 'main'}/encodings/${sourcePath}`

    return (
        <Box
            component="section"
            aria-label="About this text"
            sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, mx: 1, mb: 2, bgcolor: '#fafafa' }}
        >
            <Box
                component="dl"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '9rem minmax(0, 1fr)' },
                    columnGap: 2,
                    rowGap: { xs: 0.25, sm: 1 },
                    m: 0,
                }}
            >
                {header.title && <Row label="Text">{header.title}</Row>}
                {header.source && <Row label="Source">{header.source}</Row>}
                {header.copy && (
                    <Row label="Copy used">
                        {header.copy.shelfmark}
                        {header.copy.urn && (
                            <><Sep /><Link href={`https://nbn-resolving.org/${header.copy.urn}`} target="_blank" rel="noopener noreferrer">Digital copy</Link></>
                        )}
                        {header.copy.catalogue && (
                            <><Sep /><Link href={header.copy.catalogue} target="_blank" rel="noopener noreferrer">Catalogue record</Link></>
                        )}
                        {header.copy.iiif && (
                            <><Sep /><Link href={header.copy.iiif} target="_blank" rel="noopener noreferrer">IIIF manifest</Link></>
                        )}
                    </Row>
                )}
                {editors.length > 0 && <Row label="Edited by">{joinNames(editors)}</Row>}
                {translators.length > 0 && <Row label="Translated by">{joinNames(translators)}</Row>}
                {header.licence && (
                    <Row label="Licence">
                        {header.licence.url
                            ? <Link href={header.licence.url} target="_blank" rel="noopener noreferrer">{header.licence.label || header.licence.url}</Link>
                            : header.licence.label}
                        {header.copy && <> (text and encoding); page images: Bayerische Staatsbibliothek, Munich</>}
                    </Row>
                )}
                <Row label="Source file">
                    <Link href={`/data/${sourcePath}`}>TEI</Link>
                    <Sep />
                    <Link href={githubFile} target="_blank" rel="noopener noreferrer">View on GitHub</Link>
                </Row>
                <Row label="Cite as">
                    <CitationBox citation={expressionCitation(expression, version)} />
                </Row>
            </Box>
        </Box>
    )
}
