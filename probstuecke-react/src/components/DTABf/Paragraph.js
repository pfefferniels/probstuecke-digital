import React from 'react'
import { Alert } from 'react-bootstrap'
import { IIIFConsumer } from '../IIIF'
import FacsimileSettings from './FacsimileSettings'
import './Paragraph.scss'

const Paragraph = (props) => {
  const xmlId = props.teiDomElement.getAttribute('xml:id')

  return (
    <FacsimileSettings.Consumer>
      {(showFacsimile) => {
        if (xmlId && showFacsimile) {
          return (
            <IIIFConsumer>
              {(iiif) => (
               iiif.ready ? <div className='paragraph withFacsimile'
                                 style={{
                                   '--facsimile-image': `url(${iiif.data[xmlId]})`
                                 }}>
                              {props.children}
                            </div>
                          : <Alert>IIIF not yet ready</Alert>
              )}
            </IIIFConsumer>)
        } else {
          return <div className='paragraph'>{props.children}</div>
        }
      }}
    </FacsimileSettings.Consumer>
  )
}

export default Paragraph
