import React, { useState, useRef, useEffect } from 'react'
import { TEIRoute, TEIRender } from 'react-teirouter'
import { Spinner } from 'react-bootstrap'
import path from 'path'
import { Header, MetadataModal, NotatedMusic, Reference } from '..'
import { apiUrl } from '../../../config.js'
import Media from './Media'
import './P5.scss'
import CETEI from 'CETEIcean'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    'teiHeader': undefined
  })
  return ct.getHTML5(file)
}

const P5 = ({tei}) => {
  const headerRef = useRef()
  const [teiData, setTeiData] = useState(null)
  const teiPath = path.dirname(tei)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const data = await teiToHtml(`${apiUrl}/tei/${tei}`)
        setTeiData(data)
      } catch (e) {
        console.error('failed fetching TEI:', e)
      }
    }

    fetchTEI()
  }, [])

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
