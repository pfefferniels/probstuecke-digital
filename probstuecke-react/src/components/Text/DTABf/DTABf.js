import React, { useState, useRef, useEffect, useContext } from 'react'
import { TEIRender, TEIRoute } from 'react-teirouter'
import { Spinner } from 'react-bootstrap'
import { Header, LinkToIndex, MetadataModal, NotatedMusic, Reference } from '..'
import { apiUrl } from '../../../config.js'
import path from 'path'
import Paragraph from './Paragraph'
import Settings from '../../Settings'
import './DTABf.scss'
import CETEI from 'CETEIcean'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    'teiHeader': undefined
  })
  return ct.getHTML5(file)
}

const DTABf = props => {
  const headerRef = useRef()
  const [teiData, setTEIData] = useState(null)
  const { diplomatic } = useContext(Settings)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const teiData = await teiToHtml(`${apiUrl}/tei/${props.tei}?modernize=${diplomatic ? 0 : 1}`)
        setTEIData(teiData)
      } catch (e) {
        console.log('failed fetching TEI: ', e)
      }
    }

    fetchTEI()
  }, [diplomatic, props.tei])

  if (!teiData) {
    return <Spinner animation='grow'/>
  }

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef}/>
      </div>

      <TEIRender data={teiData} path={path.dirname(props.tei)}>
        <TEIRoute el='tei-p' component={Paragraph}/>
        <TEIRoute el='tei-notatedmusic'>
          <NotatedMusic path={path.dirname(props.tei)} />
        </TEIRoute>
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
