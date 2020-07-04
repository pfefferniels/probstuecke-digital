import React from 'react'
import { Link } from 'react-router-dom'

class LinkToIndex extends React.Component {
  state = {
    corresp: ''
  }

  componentDidMount() {
    this.setState({
      corresp: this.props.teiDomElement.getAttribute('corresp')
    })
  }

  render() {
    return this.state.corresp ?
        <Link to={`/${this.props.type}${this.state.corresp}`}>
          {this.props.children}
        </Link>
      : <span className='targetlessLink'>
          {this.props.children}
        </span>
  }
}

export default LinkToIndex
