import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Option.css'

class Option extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      show: false
    }

    this.close = this.close.bind(this)
    this.show = this.show.bind(this)
  }

  close() {
    this.setState({show: false})
  }

  show() {
    this.setState({show: true})
  }

  render() {
    return (
      <>
        <FontAwesomeIcon className='optionIcon' icon={this.props.icon} size='lg' onClick={this.props.onClick}/>

        {this.props.children}
      </>
    );
  }
}

export default Option
