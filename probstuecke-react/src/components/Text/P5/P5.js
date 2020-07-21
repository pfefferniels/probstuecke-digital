import React from 'react'
import { TEIRoute, TEIRender } from 'react-teirouter'
import Media from './Media'
import MetadataModal from '../MetadataModal'
import Header from '../Header'
import Reference from '../Reference'
import NotatedMusic from '../NotatedMusic'
import './P5.scss'

const P5 = (props) => {
  const headerRef = React.useRef()

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef}/>
      </div>

      <div className='p5'>
        <TEIRender tei={`data/${props.tei}`}>
          <TEIRoute el='tei-teiheader'>
            <Header ref={headerRef}/>
          </TEIRoute>
          <TEIRoute el='tei-media' component={Media}/>
          <TEIRoute el='tei-ref' component={Reference}/>
          <TEIRoute el='tei-notatedmusic' component={NotatedMusic}/>
        </TEIRender>
      </div>
    </>
  )
}

export default P5
