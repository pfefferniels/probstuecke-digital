import React, { useContext, useState } from 'react'
import Settings from '../Settings'
import { IIIF } from '../IIIF'
import './MeasureFacsimile.scss'

const MeasureFacsimile = ({zones, svgDomElement, bbox}) => {
  const { showFacsimile } = useContext(Settings)
  const [hover, setHover] = useState(false)
  svgDomElement.addEventListener('mouseenter', () => setHover(true))
  svgDomElement.addEventListener('mouseleave', () => setHover(false))
  const measureId = svgDomElement.getAttribute('id')

  if (showFacsimile && hover && zones) {
    const matchingZones = zones.filter(zone => zone.id === measureId)

    if (matchingZones.length > 0) {
      const matchingZone = matchingZones[0]
      return (
        <g className='measureFacsimile'>
          {matchingZone.imageApiUrl.map((imageApiUrl, i) => {
              const width = bbox.width / matchingZone.imageApiUrl.length

              return (
                <image key={`facsimileFor${measureId}_${i}`}
                       className='staffFacsimile'
                       x={bbox.x + width*i}
                       y={bbox.y}
                       width={width}
                       height={bbox.height*2}
                       href={imageApiUrl}
                       preserveAspectRatio='xMidYMin'/>
                   )
            })}
        </g>
      )
    }
  }

  return (null)
}

export default MeasureFacsimile
