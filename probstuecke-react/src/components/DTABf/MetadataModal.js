import React from 'react'
import { Alert, Modal, Button } from 'react-bootstrap'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import EventEmitter from '../EventEmitter'
import Option from '../Option'
import './MetadataModal.scss'

class MetadataModal extends React.Component {
  state = {
    show: false,
    metadata: null
  }

  metadataSubscription = null

  componentDidMount() {
    this.show = this.show.bind(this)
    this.close = this.close.bind(this)
    this.metadataAvailable = this.metadataAvailable.bind(this)

    this.metadataSubscription = EventEmitter.subscribe('metadataAvailable', this.metadataAvailable)
  }

  componentWillUnmount() {
    this.metadataSubscription.cancel()
  }

  metadataAvailable(metadata) {
    this.setState({
      metadata: metadata
    })
  }

  show() {
    this.setState({
      show: true
    })
  }

  close() {
    this.setState({
      show: false
    })
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
          {this.state.metadata ? <div className='teiMetadata'
                                       dangerouslySetInnerHTML={{__html: this.state.metadata.innerHTML}}/>
                                : <Alert>Something went wrong</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant='secondary' onClick={this.close}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Option>)
  }
}

export default MetadataModal
