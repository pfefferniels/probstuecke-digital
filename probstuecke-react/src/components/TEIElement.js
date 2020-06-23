import React from 'react'
import Overlay from './Overlay.js'
import MusicExample from './MusicExample.js'
import EditorialNote from './EditorialNote.js'
import EventEmitter from './EventEmitter.js'

class TEIElement extends React.Component {
  forwardTeiAttributes() {
    return Array.from(this.props.teiDomElement.attributes).reduce((acc, att) => {
      if (att.name === 'ref') {
        acc['_ref'] = att.value
        return acc
      }
      acc[att.name] = att.value
      return acc
    }, {})
  }

  componentWillUnmount() {
    console.log('Unmounting TEIElement')
  }

  render() {
    const el = this.props.teiDomElement

    switch (el.tagName.toLowerCase()) {
      case 'tei-notatedmusic':
        return <MusicExample notatedMusic={el} teiPath={this.props.teiPath} />
      case 'tei-note':
        return <EditorialNote teiNote={el}/>
      case 'tei-teiheader':
        EventEmitter.dispatch('metadataAvailable', el)
        return (null)
      case 'tei-ref':
        return <Overlay teiRef={el}/>
      default:
        break
    }

    const teiChildren = Array.from(el.childNodes).map((teiEl, i) => {
      switch (teiEl.nodeType) {
        case 1:
          return <TEIElement
            key={`${teiEl.tagName}_${i}`}
            teiDomElement={teiEl}
            teiPath={this.props.teiPath} />
        case 3:
          return teiEl.nodeValue
        default:
          return null
      }
    })

    return React.createElement(this.props.teiDomElement.tagName.toLowerCase(),
      {
        ...this.forwardTeiAttributes(),
      },
      teiChildren
    )
  }
}

export default TEIElement
