'use client'

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItemText, ListItemButton, ListItem, Typography } from '@mui/material';
import { ExportPDFModal } from './ExportPDFModal';
import type { Expression } from '@/lib/types'

interface DownloadDialogProps {
    open: boolean
    onClose: () => void
    expression: Expression
}

export const DownloadDialog = ({ open, onClose, expression }: DownloadDialogProps) => {
    const [showPDFOptions, setShowPDFOptions] = useState(false);
    const [error, setError] = useState<string | null>(null)
    const meiData = expression.mei?.find(mei => mei?.xmlId === 'score')?.mei
    const baseName = expression.expressionId || 'probstueck'

    const handleMEI = () => {
        if (!meiData) return
        downloadAs(`${baseName}.mei`, meiData, 'application/xml');
    }

    const handleTEI = async () => {
        setError(null)
        try {
            // the TEI sources are copied to /data/ at build time (scripts/copy-data.mjs)
            const response = await fetch(`/data/${expression.sourcePath}`)
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
            downloadAs(`${baseName}.tei.xml`, await response.text(), 'application/xml')
        }
        catch (e) {
            setError(`The TEI file could not be loaded (${(e as Error).message}).`)
        }
    }

    const handlePDF = () => {
        setShowPDFOptions(true)
    }

    return (
        <Dialog open={open} onClose={onClose}>

            <DialogTitle>Download</DialogTitle>
            <DialogContent>
                {showPDFOptions && meiData
                    ? (
                        <ExportPDFModal meiData={meiData} fileName={`${baseName}.pdf`} />
                    )
                    : (
                        <List>
                            {meiData && (
                                <ListItem>
                                    <ListItemButton onClick={handlePDF}>
                                        <ListItemText
                                            primary="PDF (music only)"
                                            secondary="Download the music notation as a PDF file."
                                        />
                                    </ListItemButton>
                                </ListItem>
                            )}
                            {meiData && (
                                <ListItem>
                                    <ListItemButton onClick={handleMEI}>
                                        <ListItemText
                                            primary="MEI"
                                            secondary="Download the music encoding in MEI format."
                                        />
                                    </ListItemButton>
                                </ListItem>
                            )}
                            <ListItem>
                                <ListItemButton onClick={handleTEI}>
                                    <ListItemText
                                        primary="TEI"
                                        secondary="Download the text encoding in TEI format."
                                    />
                                </ListItemButton>
                            </ListItem>
                            {error && (
                                <ListItem>
                                    <Typography color="error" variant="body2">{error}</Typography>
                                </ListItem>
                            )}
                        </List>
                    )}
            </DialogContent >
        </Dialog >
    )
}

export const downloadAs = (filename: string, content: string | Blob, contentType?: string) => {
    const blob = typeof content === 'string'
        ? new Blob([content], { type: contentType })
        : content;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
