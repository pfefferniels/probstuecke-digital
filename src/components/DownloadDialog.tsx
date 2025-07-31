import React from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItemText, ListItemButton, ListItem } from '@mui/material';
import { ExportPDFModal } from './ExportPDFModal';

interface DownloadDialogProps {
    open: boolean
    onClose: () => void
    expression: Queries.expression
}

export const DownloadDialog = ({ open, onClose, expression }: DownloadDialogProps) => {
    const [showPDFOptions, setShowPDFOptions] = React.useState(false);
    const meiData = expression.mei?.find(mei => mei?.xmlId === 'score')?.mei || 'no MEI'
    const handleMEI = () => {
        downloadAs('music.mei', meiData, 'application/xml');
    }

    const handlePDF = () => {
        setShowPDFOptions(true)
    }

    return (
        <Dialog open={open} onClose={onClose}>

            <DialogTitle>Download</DialogTitle>
            <DialogContent>
                {showPDFOptions
                    ? (
                        <ExportPDFModal meiData={meiData} />
                    )
                    : (
                        <List>
                            <ListItem>
                                <ListItemButton onClick={handlePDF}>
                                    <ListItemText
                                        primary="PDF (music only)"
                                        secondary="Download the music notation as a PDF file."
                                    />
                                </ListItemButton>
                            </ListItem>
                            <ListItem>
                                <ListItemButton>
                                    <ListItemText
                                        primary="PDF (text and music)"
                                        secondary="Download the text and music notation as a PDF file. (Not yet implemented)"
                                    />
                                </ListItemButton>
                            </ListItem>
                            <ListItem>
                                <ListItemButton onClick={handleMEI}>
                                    <ListItemText
                                        primary="MEI"
                                        secondary="Download the music encoding in MEI format."
                                    />
                                </ListItemButton>
                            </ListItem>
                            <ListItem>
                                <ListItemButton>
                                    <ListItemText
                                        primary="TEI"
                                        secondary="Download the text encoding in TEI format."
                                    />
                                </ListItemButton>
                            </ListItem>
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
