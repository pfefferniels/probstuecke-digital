import React, { useRef } from 'react'
import { TEIRoute, TEIRender } from 'react-teirouter'
import { Spinner } from 'react-bootstrap'
import { useAPIError, useTEI } from '../../../hooks'
import { Header, MetadataModal, NotatedMusic, Reference } from '..'
import { apiUrl } from '../../../config.js'
import Media from './Media'
import './P5.scss'

const P5 = ({tei}) => {
  const headerRef = useRef()
  const { addError } = useAPIError()
  const { teiPath, teiData } = useTEI(tei, addError)

  if (!teiData) {
    return <Spinner animation='grow' />
  }

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef}/>
      </div>

      <div className='p5'>
        <TEIRender data={teiData}>
          <TEIRoute el='tei-teiheader'>
            <Header ref={headerRef}/>
          </TEIRoute>
          <TEIRoute el='tei-media'>
            <Media path={teiPath} />
          </TEIRoute>
          <TEIRoute el='tei-ref' component={Reference}/>
          <TEIRoute el='tei-notatedmusic'>
            <NotatedMusic path={teiPath} />
          </TEIRoute>
        </TEIRender>
      </div>
    </>
  )
}

export default P5
