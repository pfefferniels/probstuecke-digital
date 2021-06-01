import React, { useState, useEffect } from 'react'
import { apiUrl } from '../../../config.js'

const Media = (props) => {
  if (!props.teiNode.hasAttribute('mimeType') ||
      !props.teiNode.hasAttribute('url')) {
    return null
  }

  const mimeType = props.teiNode.getAttribute('mimeType')
  const url = props.teiNode.getAttribute('url')

  if (mimeType.startsWith('audio/')) {
    return (
      <audio className='embeddedAudio' style={{
        display: 'block'
      }} controls>
        <source src={`${apiUrl}/${props.path}/${url}`} type={mimeType}/>
      </audio>
    )
  }

  return null
}

export default Media
