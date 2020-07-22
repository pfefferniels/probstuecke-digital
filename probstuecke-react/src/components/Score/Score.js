import React from 'react'
import { scoreToolkit } from '../Verovio'
import { Spinner } from 'react-bootstrap'
import Settings from '../Settings'
import Option from '../Option'
import './Score.scss'

const Score = (props) => {
  const { diplomatic } = React.useContext(Settings)
  const scoreRef = React.useRef(null)
  const [svg, setSVG] = React.useState(null)
  const [stavesAbove, setStavesAbove] = React.useState(0)
  const [embed, setEmbed] = React.useState(false)

  React.useEffect(() => {
    const fetchScore = async () => {
      const meiData = await fetch(
        `/data/${props.mei}?` +
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
      props.scoreDidUpdate(scoreRef.current.querySelector('svg'))
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
                  id='scoreView'
                  dangerouslySetInnerHTML={{__html: svg}}/>
           : <Spinner animation='grow'/>
        }
      </div>
    </>
  )
}

export default Score
