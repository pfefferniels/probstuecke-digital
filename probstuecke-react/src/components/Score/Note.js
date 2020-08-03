import React from 'react'

const Note = ({svgDomElement, children}) => {
  return (
    <g className='note'>
      {children}
    </g>
  )
}

export default Note
