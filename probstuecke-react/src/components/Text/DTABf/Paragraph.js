import React, { useContext } from 'react'
import { Alert } from 'react-bootstrap'
import { IIIF } from '../../IIIF'
import Settings from '../../Settings'
import './Paragraph.scss'

const Paragraph = ({zones, teiNode, children}) => {
  const { showFacsimile } = useContext(Settings)
  const xmlId = teiNode.getAttribute('xml:id')
  const facs = teiNode.getAttribute('facs')

  let style = {}
  let classNames = ['paragraph']

  if (xmlId && facs && showFacsimile && zones) {
    const matchingZones = zones.filter(item => item.id == facs.substr(1))
    if (matchingZones.length > 0) {
      classNames.push('withFacsimile')
      style = {
        '--facsimile-image': matchingZones.map(zone => `url(${zone.imageApiUrl})`).join(',')
      }
    }
  }

  return (
    <div className={classNames.join(' ')} style={style}>
      {children}
    </div>
  )
}

export default Paragraph
