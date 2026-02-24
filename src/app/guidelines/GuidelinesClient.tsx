'use client'

import { Container } from '@mui/material'
import Ceteicean from '@/ceteicean/Ceteicean'
import { Behavior } from '@/ceteicean/Behavior'
import type { TransformedTEI } from '@/lib/types'

interface GuidelinesClientProps {
  transformed: TransformedTEI
}

export default function GuidelinesClient({ transformed }: GuidelinesClientProps) {
  const routes = {
    'teieg-egxml': (props: any) => {
      let xml = new XMLSerializer().serializeToString(props.teiNode)
      xml = xml.replaceAll('teieg-', '')
      xml = xml.replaceAll('data-', '')

      return (
        <Behavior node={props.teiNode}>
          <pre style={{ fontSize: '0.8rem' }}>
            {xml}
          </pre>
        </Behavior>
      )
    }
  }

  return (
    <Container sx={{ marginTop: 5 }}>
      <Ceteicean pageContext={transformed} routes={routes} />
    </Container>
  )
}
