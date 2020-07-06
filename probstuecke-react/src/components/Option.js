import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Option.scss'

class Option extends React.Component {
  state = {
    toggle: false,
    isActive: false
  }

  componentDidMount() {
    this._onClick = this._onClick.bind(this)

    if (this.props.toggle) {
      this.setState({
        toggle: true
      })
    }
  }

  _onClick() {
    if (this.state.toggle) {
      this.setState({
        isActive: !this.state.isActive
      })
    }
    this.props.onClick()
  }

  render() {
    return (
      <>
        {this.props.icon && <FontAwesomeIcon className={`optionIcon ${this.state.isActive ? 'active' : 'inactive'}`}
                                             icon={this.props.icon}
                                             size='lg'
                                             onClick={this._onClick}
                                             ref={this.props.ref}/>}
        {this.props.text && <span className={`optionText ${this.state.isActive ? 'active' : 'inactive'}`}
                                  size='lg'
                                  onClick={this._onClick}
                                  ref={this.props.ref}>{this.props.text}</span>}

        {this.props.children}
      </>
    )
  }
}

export default Option
