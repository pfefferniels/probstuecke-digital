import React, { Component } from 'react'
import { Alert, Modal, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import EventEmitter from './EventEmitter.js'
import Option from './Option.js'
import './MetadataModal.css'

class MetadataModal extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      show: false,
      metadata: null
    }
    this.show = this.show.bind(this)
    this.close = this.close.bind(this)
    this.metadataAvailable = this.metadataAvailable.bind(this)

    EventEmitter.subscribe('metadataAvailable', this.metadataAvailable)
  }

  metadataAvailable(metadata) {
    this.setState(prevState => ({
      ...prevState,
      metadata: metadata
    }))
  }

  show() {
    this.setState(prevState => ({
      ...prevState,
      show: true
    }))
  }

  close() {
    this.setState(prevState => ({
      ...prevState,
      show: false
    }))
  }

  render() {
    return (
      <Option icon={faInfoCircle}
              onClick={this.show}>
        <Modal show={this.state.show}
               onHide={this.close}
               size='lg'
               centered>
          <Modal.Header closeButton>
            <Modal.Title>Metadata</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {
              this.state.metadata ? <div dangerouslySetInnerHTML={{__html: this.state.metadata.innerHTML}}/>
                                  : <Alert>Something went wrong</Alert>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.close}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Option>)
  }
}

export default MetadataModal
