import React from 'react'
import path from 'path'

const Media = (props) => {
  if (!props.teiDomElement.hasAttribute('mimeType') ||
      !props.teiDomElement.hasAttribute('url')) {
    return (null)
  }

  const mimeType = props.teiDomElement.getAttribute('mimeType')
  const url = props.teiDomElement.getAttribute('url')
  const directory = path.dirname(props.teiPath)
  const dataPath = `/data/${directory}/${url}`

  if (mimeType.startsWith('audio/')) {
    return (
      <audio className='embeddedAudio' controls>
        <source src={dataPath} type={mimeType}/>
      </audio>
    )
  }

  return (null)
}

export default Media
