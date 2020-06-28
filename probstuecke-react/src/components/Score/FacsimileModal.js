import React, { useState, useRef } from 'react'
import { Modal, Button, Overlay, Tooltip } from 'react-bootstrap'
import { faImages } from '@fortawesome/free-solid-svg-icons'
import Option from '../Option'

const FacsimileModal = props => {
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <Option icon={faImages}
            onClick={handleShow}>
      <Modal show={show}
             onHide={handleClose}
             size='lg'
             centered>
        <Modal.Header closeButton>
          <Modal.Title>Facsimile Images</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            ...
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Option>
  )
}

export default FacsimileModal
