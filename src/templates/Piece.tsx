import React, { useEffect } from 'react'
import Layout from '../components/Layout'
import './Piece.css'
import './CETEI-dta.css'
import { NotatedMusic } from '../components/NotatedMusic'
import Ceteicean from "gatsby-theme-ceteicean/src/components/Ceteicean"
import { Behavior } from 'gatsby-theme-ceteicean/src/components/Behavior'
import { Grid2, IconButton } from '@mui/material'
import { Word } from '../components/Word'
import { VerovioProvider } from '../hooks/useVerovio'
import { Ref } from '../components/Ref'
import { GlowDefs } from '../components/GlowDefs'
import LinkToIndex from '../components/LinkToIndex'
import { Download } from '@mui/icons-material'
import { DownloadDialog } from '../components/DownloadDialog'

interface PieceProps {
    pageContext: {
        piece: Queries.expression
    }
}

function Piece({ pageContext }: PieceProps) {
    const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false)
    const { piece } = pageContext

    const routes = {
        'tei-notatedmusic': (node: any) => (
            <Behavior node={node}>
                <NotatedMusic
                    teiNode={node.teiNode}
                    meis={piece.mei || []}
                    zones={(piece.zones?.filter(zone => !!zone) || []) as Queries.expressionZones[]}
                    refs={piece.refTargets || []}
                    expressionId={piece.expressionId || undefined} />
            </Behavior>),
        'tei-w': Word,
        'tei-ref': Ref,
        'tei-persname': (props: any) => <LinkToIndex type='persons' {...props} />,
        'tei-name': (props: any) => <LinkToIndex type='musicalworks' {...props} />,
        'tei-bibl': (props: any) => <LinkToIndex type='bibliography' {...props} />,
    }

    const title = piece.title?.original
        ? new DOMParser().parseFromString(piece.title.original, 'text/xml').documentElement.textContent?.trim().replaceAll('ſ', 's')
        : ''



    useEffect(() => {
        const pdfkitScript = document.createElement("script");
        pdfkitScript.type = "application/javascript";
        pdfkitScript.src = "/pdfKit.standalone.js";
        document.body.appendChild(pdfkitScript);

        const blobstreamScript = document.createElement("script");
        blobstreamScript.type = "application/javascript";
        blobstreamScript.src = "/blob-stream.js";
        document.body.appendChild(blobstreamScript);

        const pdfKitHandler = () => {
            console.log('PDFKit loaded');
            console.log(new window.PDFDocument());
        };

        pdfkitScript.defer = true;
        pdfkitScript.addEventListener("load", pdfKitHandler);

        blobstreamScript.defer = true;
        blobstreamScript.addEventListener("load", () => console.log('blobstream loaded'));

        return () => {
            pdfkitScript.removeEventListener("load", pdfKitHandler);
        };
    }, []);

    return (
        <Layout location={title || ''}>
            <div className='piece'>
                <GlowDefs />


                <h2 className='title' style={{ textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: '0', right: '1rem' }}>
                        <IconButton color='primary' onClick={() => setDownloadDialogOpen(true)}>
                            <Download />
                        </IconButton>
                    </div>

                    <Ceteicean pageContext={piece.title as any} routes={{
                        "tei-w": Word
                    }} />
                </h2>

                <VerovioProvider>
                    <Grid2 container spacing={1}>
                        <Grid2 size={6} className='scoreView'>
                            <Ceteicean pageContext={piece.score as any} routes={routes} />
                        </Grid2>
                        <Grid2 size={6} p={1.5}>
                            <Ceteicean pageContext={piece.text as any} routes={routes} />
                        </Grid2>
                    </Grid2>
                </VerovioProvider>
            </div>

            <DownloadDialog
                open={downloadDialogOpen}
                onClose={() => setDownloadDialogOpen(false)}
                expression={piece}
            />
        </Layout>
    )
}

export default Piece