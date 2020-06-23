import React from 'react';
import './EditorialNote.css'

function EditorialNote(props) {
  const type = props.teiNote.getAttribute('type')
  return (
    <div className={ type==='editorial' ? 'editorialNote'
                                        : 'footnote'}
         dangerouslySetInnerHTML={{__html: props.teiNote.innerHTML}}/>
  )
}

export default EditorialNote;
