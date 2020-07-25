import React from 'react'
import { Alert } from 'react-bootstrap'
import { IIIF } from '../../IIIF'
import Settings from '../../Settings'
import './Paragraph.scss'

const Paragraph = (props) => {
  const xmlId = props.teiDomElement.getAttribute('xml:id')

  return (
    <Settings.Consumer>
      {({showFacsimile}) => {
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
        } else {
          return <div className='paragraph'>{props.children}</div>
        }
      }}
    </Settings.Consumer>
  )
}

export default Paragraph
