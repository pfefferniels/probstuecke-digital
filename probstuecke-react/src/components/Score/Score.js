import React, { useContext, useState, useRef, useEffect } from 'react'
import Amplify, { API } from 'aws-amplify'
import { scoreToolkit } from '../Verovio'
import { Spinner } from 'react-bootstrap'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'
import Settings from '../Settings'
import Option from '../Option'
import { SVGRouter, SVGRoute } from './SVGRouter'
import MeasureFacsimile from './MeasureFacsimile'
import generatePDF from './PDFExport'
import './Score.scss'

const Score = ({mei, scoreDidUpdate}) => {
  const { diplomatic } = useContext(Settings)
  const [svg, setSVG] = useState(null)
  const [meiData, setMEIData] = useState(null)
  const [stavesAbove, setStavesAbove] = useState(0)
  const [embed, setEmbed] = useState(false)
  const scoreRef = useRef(null)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const meiData = await API.get('probstueckeBackend',
          `/load/data/${mei}?` +
          `above=${stavesAbove}&` +
          `modernClefs=${diplomatic ? 'off' : 'on'}&` +
          `showAnnotationStaff=${embed ? 'on' : 'off'}`,
          { responseType: 'xml' }
          )
        setMEIData(meiData)

        scoreToolkit.setOptions({
          svgViewBox: true,
          adjustPageHeight: true,
          pageHeight: 60000,
          footer: 'none'
        })
        scoreToolkit.loadData(meiData)

        setSVG(scoreToolkit.renderToSVG(1, {}))
        scoreDidUpdate(scoreRef.current.querySelector('svg'))
      } catch (e) {
        console.log('error fetching MEI:', e)
      }
    }

    fetchScore()
  }, [diplomatic, stavesAbove, embed])

  return (
    <>
      <div className='options'>
        <Option text={'+'}
                onClick={() => setStavesAbove(stavesAbove + 1)}/>
        <Option text={'–'}
                onClick={() => setStavesAbove(stavesAbove - 1)}/>
        <Option toggle
                text={'{}'}
                onClick={() => setEmbed(!embed)}/>
        <Option icon={faFilePdf}
                onClick={() => generatePDF(meiData)}/>
      </div>

      <div>
        {
          svg
           ? <div ref={scoreRef}
                  className={diplomatic ? 'diplomatic' : 'modernized'}
                  id='scoreView'>
               <SVGRouter svg={svg}>
                 <SVGRoute for='.staff' component={MeasureFacsimile}/>
               </SVGRouter>
             </div>
           : <Spinner animation='grow'/>
        }
      </div>
    </>
  )
}

export default Score
