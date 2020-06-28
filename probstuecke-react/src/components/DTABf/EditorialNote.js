import React from 'react';
import './EditorialNote.css'

class EditorialNote extends React.Component {
  constructor(props) {
    super(props)
    this.noteRef = React.createRef()
  }

  componentDidMount() {
    this.noteRef.current.appendChild(this.props.teiDomElement.firstChild)
  }

  render() {
    const type = this.props.teiDomElement.getAttribute('type')
    return <div className={ type==='editorial' ? 'editorialNote'
                                               : 'footnote'}
                ref={this.noteRef} />
  }
}

export default EditorialNote;
