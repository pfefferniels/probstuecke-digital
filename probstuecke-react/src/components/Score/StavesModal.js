import React, { useState, useRef } from 'react'
import { Modal, Button, Overlay, Tooltip } from 'react-bootstrap'
import EventEmitter from '../EventEmitter'
import Option from '../Option'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

class StavesModal extends React.Component {
  state = {
    show: false
  }

  componentWillMount() {
    this.handleClose = this.handleClose.bind(this)
    this.handleShow = this.handleShow.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleClose() {
    this.setState(prevState => ({
      ...prevState,
      show: false}))
  }

  handleShow() {
    this.setState(prevState => ({
      ...prevState,
      show: true}))
  }

  handleInputChange(event) {
    const target = event.target
    const value = target.name === 'annotations' ? target.checked : target.value
    const name = target.name
    this.setState({
      [name]: value
    });
  }

  handleSubmit() {
    EventEmitter.dispatch('changeStavesAbove', this.state.stavesAbove)
    EventEmitter.dispatch('changeStavesBelow', this.state.stavesBelow)
    EventEmitter.dispatch('showAnnotationStaff', this.state.annotationStaff)

    this.handleClose()
  }

  render() {
    return (
      <Option icon={faPlus}
              onClick={this.handleShow}>
        <Modal show={this.state.show}
               onHide={this.handleClose}
               centered>
          <Modal.Header closeButton>
            <Modal.Title>Staves</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <form>
                <input id='stavesAbove' name='stavesAbove' value='0' onChange={this.handleInputChange}/>
                <label for='stavesAbove'>above</label>
                <br/>

                <input id='stavesBelow' name='stavesBelow' value='0' onChange={this.handleInputChange}/>
                <label for='stavesBelow'>above</label>
                <br/>

                <input id='annotationStaff' name='annotationStaff' type='checkbox' onChange={this.handleInputChange}/>
                <label for='annotationStaff'>embed annotations</label>
              </form>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={this.handleSubmit}>
              Apply
            </Button>
          </Modal.Footer>
        </Modal>
      </Option>
    )
  }
}

export default StavesModal
