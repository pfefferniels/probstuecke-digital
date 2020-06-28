import React from 'react'
import { TEIRoutes } from './TEI.js'

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
    const tagName = el.tagName.toLowerCase()

    const teiChildren = Array.from(el.childNodes).map((teiEl, i) => {
      switch (teiEl.nodeType) {
        case 1:
          return (
            <TEIElement key={`${teiEl.tagName}${i}`}
                        teiDomElement={teiEl}
                        teiPath={this.props.teiPath}
                        availableRoutes={this.props.availableRoutes}/>)
        case 3:
          return teiEl.nodeValue
        default:
          return null
      }
    })

    if (this.props.availableRoutes.includes(tagName)) {
      return (
        <TEIRoutes.Consumer>
          {(routes) => {
            return React.createElement(routes[tagName],
                                       this.props,
                                       teiChildren)
          }}
        </TEIRoutes.Consumer>
      )
    }

    return (
      React.createElement(tagName, {
        ...this.forwardTeiAttributes(),
      },
      teiChildren)
    )
  }
}

export default TEIElement
