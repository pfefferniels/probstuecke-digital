import React, { useState, useRef, useEffect } from 'react'
import { API } from 'aws-amplify'
import { TEIRender, TEIRoute } from 'react-teirouter'
import { Spinner } from 'react-bootstrap'
import { Header, LinkToIndex, MetadataModal, NotatedMusic, Reference } from '..'
import path from 'path'
import Glyph from './Glyph'
import Paragraph from './Paragraph'
import './DTABf.scss'

const DTABf = (props) => {
  const headerRef = useRef()
  const [teiData, setTeiData] = useState(null)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const teiData = await API.get(
          'probstueckeBackend',
          `/load/data/${props.tei}`,
          {responseType: 'xml'}
        )
        setTeiData(teiData)
      } catch (e) {
        console.log('failed getting TEI: ', e)
      }
    }

    fetchTEI()
  }, [])

  if (!teiData) {
    return <Spinner animation='grow'/>
  }

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef}/>
      </div>

      <TEIRender teiData={teiData} path={path.dirname(props.tei)}>
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
