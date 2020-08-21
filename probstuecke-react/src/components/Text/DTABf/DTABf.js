import React from 'react'
import { TEIRender, TEIRoute } from 'react-teirouter'
import { Header, LinkToIndex, MetadataModal, NotatedMusic, Reference } from '..'
import Glyph from './Glyph'
import Paragraph from './Paragraph'
import './DTABf.scss'

const DTABf = (props) => {
  const headerRef = React.useRef()

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef}/>
      </div>

      <TEIRender tei={`data/${props.tei}`}>
        <TEIRoute el='tei-p' component={Paragraph}/>
        <TEIRoute el='tei-notatedmusic' component={NotatedMusic}/>
        <TEIRoute el='tei-ref' component={Reference}/>
        <TEIRoute el='tei-teiheader'>
          <Header ref={headerRef}/>
        </TEIRoute>
        <TEIRoute el='tei-g' component={Glyph}/>
        <TEIRoute el='tei-persname'>
          <LinkToIndex type='indexOfPersons'/>
        </TEIRoute>
        <TEIRoute el='tei-bibl'>
          <LinkToIndex type='bibliography'/>
        </TEIRoute>
        <TEIRoute el='tei-name'>
          <LinkToIndex type='indexOfMusicalWorks'/>
        </TEIRoute>
      </TEIRender>
    </>
  )
}

export default DTABf
