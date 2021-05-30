import React, { useContext } from 'react'
import { Alert } from 'react-bootstrap'
import { IIIF } from '../../IIIF'
import Settings from '../../Settings'
import './Paragraph.scss'

const Paragraph = (props) => {
  const { showFacsimile } = useContext(Settings)
  const xmlId = props.teiNode.getAttribute('xml:id')

  if (xmlId && showFacsimile) {
    return (
      <IIIF.Consumer>
        {(iiif) => (
         iiif.ready ? <div className='paragraph withFacsimile'
                           style={{
                             '--facsimile-image': iiif.data[xmlId].map(url => `url(${url})`).join(',')
                           }}>
                        {props.children}
                      </div>
                    : <Alert>IIIF not yet ready</Alert>
        )}
      </IIIF.Consumer>)
  }

  return <div className='paragraph'>{props.children}</div>
}

export default Paragraph
