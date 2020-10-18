import React, { useState, useRef, useEffect } from 'react'
import { API } from 'aws-amplify'
import { TEIRoute, TEIRender } from 'react-teirouter'
import { Spinner } from 'react-bootstrap'
import path from 'path'
import { Header, MetadataModal, NotatedMusic, Reference } from '..'
import Media from './Media'
import './P5.scss'

const P5 = (props) => {
  const headerRef = useRef()
  const [teiData, setTeiData] = useState(null)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const data = await API.get(
          'probstueckeBackend',
          `/load/data/${props.tei}`,
          {responseType: 'xml'})
        setTeiData(data)
      } catch (e) {
        console.log('failed fetching TEI:', e)
      }
    }

    fetchTEI()
  })

  if (!teiData) {
    return <Spinner animation='grow' />
  }

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef}/>
      </div>

      <div className='p5'>
        <TEIRender teiData={teiData} path={path.dirname(props.tei)}>
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
