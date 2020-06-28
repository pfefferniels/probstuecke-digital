import React, { useState } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { faHashtag } from '@fortawesome/free-solid-svg-icons'
import Option from '../Option'

function AccidentalsModal(props) {
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <Option icon={faHashtag}
            onClick={handleShow}>
      <Modal show={show}
             onHide={handleClose}
             size='lg'
             centered>
        <Modal.Header closeButton>
          <Modal.Title>Accidentals</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Accidentals settings
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

export default AccidentalsModal
