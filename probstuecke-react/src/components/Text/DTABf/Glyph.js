import React, { useContext } from 'react'
import Settings from '../../Settings'

const Glyph = ({teiDomElement, children}) => {
  const type = teiDomElement.getAttribute('type')
  const { diplomatic } = useContext(Settings)
  switch (type) {
    case 'long-s':
      return diplomatic ? <span>ſ</span> : <span>s</span>
    case 'umlaut-o':
      return diplomatic ? <span>oͤ</span> : <span>ö</span>
    case 'umlaut-a':
      return diplomatic ? <span>aͤ</span> : <span>ä</span>
    case 'umlaut-u':
      return diplomatic ? <span>uͤ</span> : <span>ü</span>
    default:
      return <span className='unknownGlyph'>{children}</span>
  }
}

export default Glyph
