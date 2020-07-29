import React, { useContext, useState } from 'react'
import Settings from '../Settings'
import { IIIF } from '../IIIF'
import './MeasureFacsimile.scss'

const MeasureFacsimile = ({svgDomElement}) => {
  const { showFacsimile } = useContext(Settings)
  const iiif = useContext(IIIF)
  const [hover, setHover] = useState(false)
  const bbox = svgDomElement.getBBox()
  const measureId = svgDomElement.getAttribute('id')
  svgDomElement.addEventListener('mouseenter', () => setHover(true))
  svgDomElement.addEventListener('mouseleave', () => setHover(false))

  if (showFacsimile && hover && iiif.ready && iiif.data[measureId]) {
    return (
      <g className='measureFacsimile'>
        {iiif.data[measureId].map((imageUrl, i) => (
          <image key={`facsimileFor${measureId}_${i}`}
                 className='staffFacsimile'
                 x={bbox.x}
                 y={bbox.y}
                 width={bbox.width}
                 height={bbox.height*2}
                 href={imageUrl}
                 preserveAspectRatio='xMidYMin'/>))
        }
      </g>
    )
  }

  return (null)
}

export default MeasureFacsimile
