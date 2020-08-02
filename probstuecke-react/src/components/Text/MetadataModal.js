import React, { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import Option from '../Option'
import './MetadataModal.scss'

const MetadataModal = ({ headerRef }) => {
  const [show, setShow] = useState(false)

  return (
    <Option icon={faInfoCircle}
            onClick={() => setShow(!show)}>
      <Modal show={show}
             onHide={() => setShow(false)}
             size='lg'
             centered>
        <Modal.Header closeButton>
          <Modal.Title>Metadata</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='teiMetadata'>
            {headerRef.current && <div dangerouslySetInnerHTML={{__html: headerRef.current.innerHTML}}/>}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Option>)
}

export default MetadataModal
