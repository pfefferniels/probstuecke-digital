import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import Option from '../Option'
import './MetadataModal.scss'

class MetadataModal extends React.Component {
  state = {
    show: false,
    metadata: null
  }

  constructor(props) {
    super(props)
    this.show = this.show.bind(this)
    this.close = this.close.bind(this)
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
            <div className='teiMetadata'>
              {this.props.headerRef.current && <div dangerouslySetInnerHTML={{__html: this.props.headerRef.current.innerHTML}}/>}
            </div>
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
