import React from 'react';
import './Note.scss'

class Note extends React.Component {
  constructor(props) {
    super(props)
    this.noteRef = React.createRef()
  }

  componentDidMount() {
    this.noteRef.current.appendChild(this.props.teiDomElement)
  }

  render() {
    const type = this.props.teiDomElement.getAttribute('type')
    return <div className={ type==='editorial' ? 'editorialNote'
                                               : 'footnote'}
                ref={this.noteRef} />
  }
}

export default Note;
