import React, { useContext, useState, useRef, useEffect } from 'react'
import { scoreToolkit } from '../Verovio'
import { Spinner } from 'react-bootstrap'
import Settings from '../Settings'
import Option from '../Option'
import { SVGRender, SVGRoute } from './SVGRender/SVGRouter'
import StaffWithFacsimile from './StaffWithFacsimile'
import './Score.scss'

const Score = ({mei, scoreDidUpdate}) => {
  const { diplomatic } = useContext(Settings)
  const [svg, setSVG] = useState(null)
  const [stavesAbove, setStavesAbove] = useState(0)
  const [embed, setEmbed] = useState(false)
  const scoreRef = useRef(null)

  useEffect(() => {
    const fetchScore = async () => {
      const meiData = await fetch(
        `/data/${mei}?` +
        `above=${stavesAbove}&` +
        `modernClefs=${diplomatic ? 'off' : 'on'}&` +
        `showAnnotationStaff=${embed ? 'on' : 'off'}`
        ).then(response => response.text())

      scoreToolkit.setOptions({
        svgViewBox: true,
        adjustPageHeight: true,
        pageHeight: 60000,
        footer: 'none'
      })
      scoreToolkit.loadData(meiData)

      setSVG(scoreToolkit.renderToSVG(1, {}))
      scoreDidUpdate(scoreRef.current.querySelector('svg'))
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
      </div>

      <div>
        {
          svg
           ? <div ref={scoreRef}
                  className={diplomatic ? 'diplomatic' : 'modernized'}
                  id='scoreView'>
               <SVGRender svg={svg}>
                 <SVGRoute el='staff' component={StaffWithFacsimile}/>
               </SVGRender>
             </div>
           : <Spinner animation='grow'/>
        }
      </div>
    </>
  )
}

export default Score
