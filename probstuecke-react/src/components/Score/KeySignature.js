import React, { useContext, useState } from 'react'

//get-key-character.xql?number=${number}&author=${author}

const KeySignature = ({svgDomElement, bbox}) => {
  const [hover, setHover] = useState(false)
  svgDomElement.addEventListener('mouseenter', () => setHover(true))
  svgDomElement.addEventListener('mouseleave', () => setHover(false))

  return (
    <rect x={bbox.x}
          y={bbox.y}
          width={bbox.width}
          height={bbox.height}
          className='keySigOverlay' style={{
            fill: hover ? 'red' : 'orange',
            fillOpacity: 0.5
          }} />
  )
}

export default KeySignature
