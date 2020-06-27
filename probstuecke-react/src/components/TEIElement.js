import React from 'react'
import Overlay from './Overlay.js'

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

  render() {
    const el = this.props.teiDomElement

    switch (el.tagName.toLowerCase()) {
      case 'tei-teiheader':
        return this.props.onTeiHeader(el)
      case 'tei-persname':
        return this.props.onPersName(el)
      case 'tei-notatedmusic':
        return this.props.onNotatedMusic(el)
      case 'tei-note':
        return this.props.onNote(el)
      case 'tei-ref':
        return this.props.onRef(el)
      default:
        break
    }

    const teiChildren = Array.from(el.childNodes).map((teiEl, i) => {
      switch (teiEl.nodeType) {
        case 1:
          return <TEIElement
            key={`${teiEl.tagName}_${i}`}
            teiDomElement={teiEl}
            teiPath={this.props.teiPath}
            onNote={this.props.onNote}
            onPersName={this.props.onPersName}
            onNotatedMusic={this.props.onNotatedMusic}
            onRef={this.props.onRef}
            onTeiHeader={this.props.onTeiHeader}/>
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
