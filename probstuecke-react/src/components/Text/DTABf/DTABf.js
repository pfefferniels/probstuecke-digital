import React, { useState, useRef, useEffect, useContext } from 'react'
import { TEIRender, TEIRoute } from 'react-teirouter'
import { Spinner } from 'react-bootstrap'
import { Header, LinkToIndex, MetadataModal, NotatedMusic, Reference } from '..'
import { apiUrl } from '../../../config.js'
import path from 'path'
import Paragraph from './Paragraph'
import Settings from '../../Settings'
import './DTABf.scss'

const DTABf = props => {
  const headerRef = useRef()
  const [teiData, setTEIData] = useState(null)
  const { diplomatic } = useContext(Settings)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        console.log('fetching', `${apiUrl}/tei/${props.tei}?modernize=${diplomatic ? 0 : 1}`)
        const data = await fetch(`${apiUrl}/tei/${props.tei}?modernize=${diplomatic ? 0 : 1}`)
        const text = await data.text()
        setTEIData(text)
      } catch (e) {
        console.log('failed fetching TEI: ', e)
      }
    }

    fetchTEI()
  }, [diplomatic])

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
