import React from 'react'
import Layout from '../components/Layout'
import './Piece.css'
import './CETEI-dta.css'
import { NotatedMusic } from '../components/NotatedMusic'
import Ceteicean from "gatsby-theme-ceteicean/src/components/Ceteicean"
import { Behavior } from 'gatsby-theme-ceteicean/src/components/Behavior'
import { Grid } from '@mui/material'
import { Word } from '../components/Word'
import { VerovioProvider } from '../hooks/useVerovio'
import { Ref } from '../components/Ref'
import { GlowDefs } from '../components/GlowDefs'

interface PieceProps {
    pageContext: {
        piece: Queries.expression
    }
}

function Piece({ pageContext }: PieceProps) {
    const { piece } = pageContext

    const routes = {
        'tei-notatedmusic': (node: any) => (
            <Behavior node={node}>
                <NotatedMusic
                    teiNode={node.teiNode}
                    meis={piece.mei || []}
                    refs={piece.refTargets || []} />
            </Behavior>),
        'tei-w': Word,
        'tei-ref': Ref
    }

    return (
        <Layout>
            <div className='piece'>
                <GlowDefs />

                <h2 className='title' style={{ textAlign: 'center' }}>
                    <Ceteicean pageContext={piece.title as any} routes={{
                        "tei-w": Word
                    }} />
                </h2>

                <VerovioProvider>
                    <Grid container spacing={1}>
                        <Grid item xs={6} className='scoreView'>
                            <Ceteicean pageContext={piece.score as any} routes={routes} />
                        </Grid>
                        <Grid item xs={6} p={1.5}>
                            <Ceteicean pageContext={piece.text as any} routes={routes} />
                        </Grid>
                    </Grid>
                </VerovioProvider>
            </div>
        </Layout>
    )
}

export default Piece