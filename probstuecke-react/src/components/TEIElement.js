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
        if (this.props.onTeiHeader) return this.props.onTeiHeader(el)
        break
      case 'tei-persname':
        if (this.props.onPersName) return this.props.onPersName(el)
        break
      case 'tei-notatedmusic':
        if (this.props.onNotatedMusic) return this.props.onNotatedMusic(el)
        break
      case 'tei-note':
        if (this.props.onNote) return this.props.onNote(el)
        break
      case 'tei-ref':
        if (this.props.onRef) return this.props.onRef(el)
        break
      case 'tei-idno':
        if (this.props.onIdno) return this.props.onIdno(el)
        break
    }

    const teiChildren = Array.from(el.childNodes).map((teiEl, i) => {
      switch (teiEl.nodeType) {
        case 1:
          return <TEIElement
            key={`${teiEl.tagName}${i}`}
            teiDomElement={teiEl}
            teiPath={this.props.teiPath}
            onNote={this.props.onNote}
            onPersName={this.props.onPersName}
            onNotatedMusic={this.props.onNotatedMusic}
            onRef={this.props.onRef}
            onTeiHeader={this.props.onTeiHeader}
            onIdno={this.props.onIdno}/>
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
