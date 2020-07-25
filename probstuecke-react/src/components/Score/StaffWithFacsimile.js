import React, { useContext, useState, useRef, useEffect } from 'react'
import Settings from '../Settings'
import { IIIF } from '../IIIF'
import './StaffWithFacsimile.scss'

const StaffWithFacsimile = ({svgDomElement, children}) => {
  const { showFacsimile } = useContext(Settings)
  const iiif = useContext(IIIF)
  const staffRef = useRef(null)
  const [hover, setHover] = useState(false)
  const [bbox, setBBox] = useState(null)

  const measureId = svgDomElement.getAttribute('id')

  useEffect(() => {
    if (!showFacsimile || !staffRef.current || !iiif.ready) return

    const el = staffRef.current
    setBBox(el.getBBox())

    el.addEventListener('mouseenter', () => setHover(true))
    el.addEventListener('mouseleave', () => setHover(false))
  }, [showFacsimile, staffRef])

  return (
    <g className='staff withFacsimile' ref={staffRef}>
      {(showFacsimile && hover && bbox && iiif.ready && iiif.data[measureId])
        ? iiif.data[measureId].map(imageUrl => (
            <image className='staffFacsimile'
                   x={bbox.x}
                   y={bbox.y}
                   width={bbox.width}
                   height={bbox.height*2}
                   href={imageUrl}
                   preserveAspectRatio='xMidYMin'/>))
        : children}
    </g>
  )
}

export default StaffWithFacsimile
