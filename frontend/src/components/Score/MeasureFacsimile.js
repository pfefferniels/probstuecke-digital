import React, { useContext, useEffect, useState } from 'react'
import Settings from '../Settings'
import { apiUrl } from '../../config'
import './MeasureFacsimile.scss'

const MeasureFacsimile = ({ svgDomElement, bbox, path }) => {
  const { showFacsimile } = useContext(Settings)
  const [hover, setHover] = useState(false)
  const [imageLinks, setImageLinks] = useState([])
  svgDomElement.addEventListener('mouseenter', () => setHover(true))
  svgDomElement.addEventListener('mouseleave', () => setHover(false))

  useEffect(() => {
    if (!svgDomElement.hasAttribute('data-facs')) {
      console.log(svgDomElement, 'has no @facs attribute')
      return
    }

    const facs = svgDomElement.getAttribute('data-facs').split(' ').map(f => f.substr(1))

    const fetchImageLinks = async () => {
      setImageLinks(
        await Promise.all(facs.map(async (id) => {
          try {
            const response = await fetch(`${apiUrl}/facsimile-zone?path=${path}&id=${id}`)
            const data = await response.json()
            return data.imageApiUrl
          } catch (e) {
            console.log(e)
          }
      })));
    }

    fetchImageLinks()
 }, [svgDomElement])

  if (showFacsimile && hover && imageLinks.length > 0) {
      return (
        <g className='measureFacsimile'>
          {imageLinks.map((link, i) => {
            const width = bbox.width / imageLinks.length

            return (
              <image
                key={`facsimile${i}`}
                className='staffFacsimile'
                x={bbox.x + width * i}
                y={bbox.y}
                width={width}
                height={bbox.height * 2}
                href={link}
                preserveAspectRatio='xMidYMin'
              />
            )
          })}
        </g>
      )
  }

  return null
}

export default MeasureFacsimile
