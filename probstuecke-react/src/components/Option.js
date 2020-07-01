import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Option.scss'

class Option extends React.Component {
  state = {
    toggle: false,
    isActive: false
  }

  componentDidMount() {
    if (this.props.toggle) {
      this.setState({
        toggle: true
      })
    }
  }

  render() {
    return (
      <span className='option'>
        <FontAwesomeIcon className={this.state.isActive ? 'active' : 'inactive'}
                         icon={this.props.icon}
                         size='lg'
                         onClick={() => {
                           if (this.state.toggle) {
                             this.setState({
                               isActive: !this.state.isActive
                             })
                           }
                           this.props.onClick()
                         }}
                         ref={this.props.ref}/>
          {this.props.children}
      </span>
    )
  }
}

export default Option
