import React, { useContext, useState, useRef, useEffect } from 'react'
import { apiUrl } from '../../config'
import useAPIError from '../../hooks/useAPIError'
import api from '../../api'
import { scoreToolkit } from '../Verovio'
import { Spinner } from 'react-bootstrap'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'
import Settings from '../Settings'
import Option from '../Option'
import { SVGRouter, SVGRoute } from './SVGRouter'
import MeasureFacsimile from './MeasureFacsimile'
import MeterSignature from './MeterSignature'
import KeySignature from './KeySignature'
import generatePDF from './PDFExport'
import './Score.scss'

const Score = ({mei, scoreDidUpdate}) => {
  const { addError } = useAPIError()
  const { diplomatic } = useContext(Settings)
  const [svg, setSVG] = useState(null)
  const [meiData, setMEIData] = useState(null)
  const [stavesAbove, setStavesAbove] = useState(0)
  const [embed, setEmbed] = useState(false)
  const [facsimileZones, setFacsimileZones] = useState(null)
  const scoreRef = useRef(null)

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const data = await fetch(
          `${apiUrl}/mei/${mei}?` +
          `stavesAbove=${stavesAbove}&` +
          `stavesBelow=0&` +
          `modernClefs=${diplomatic ? 'off' : 'on'}&` +
          `removeAnnotationStaff=${embed ? 'off' : 'on'}`)
        const text = await data.text()
        console.log(text)

        scoreToolkit.setOptions({
          svgViewBox: true,
          adjustPageHeight: true,
          pageHeight: 60000,
          footer: 'none'
        })
        scoreToolkit.loadData(text)

        setSVG(scoreToolkit.renderToSVG(1, {}))
        setMEIData(text)
        scoreDidUpdate(scoreRef.current.querySelector('svg'))
      } catch (e) {
        addError(`error fetching MEI: ${e}`, 'warning')
      }
    }

    const fetchFacsimile = async () => {
      api.get(`mei-facsimile/${mei}`)
        .then(response => {
          if (response.ok) {
            setFacsimileZones(response.data.zones)
          } else {
            addError(`error fetching facsimile: ${response.problem}`, 'warning')
          }
        })
    }

    fetchScore()
    fetchFacsimile()
  }, [diplomatic, stavesAbove, embed, mei])

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
               <SVGRouter svg={svg} childPropsChanged={!!facsimileZones}>
                 <SVGRoute for='.meterSig' component={MeterSignature}/>
                 <SVGRoute for='.keySig' component={KeySignature}/>
                 <SVGRoute for='.staff'>
                   <MeasureFacsimile zones={facsimileZones}/>
                  </SVGRoute>
               </SVGRouter>
             </div>
           : <Spinner animation='grow'/>
        }
      </div>
    </>
  )
}

export default Score
