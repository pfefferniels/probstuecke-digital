import React from 'react'
import { TEIRoutes } from './TEI'

class TEIElement extends React.Component {
  forwardTeiAttributes() {
    return Array.from(this.props.teiDomElement.attributes).reduce((acc, att) => {
      acc[att.name === 'ref' ? '_ref' : att.name] = att.value
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
      const propsClone = {
        ...this.props,
        teiDomElement: this.props.teiDomElement.cloneNode(true)
      }

      return (
        <TEIRoutes.Consumer>
          {(routes) => {
            return React.createElement(routes[tagName],
                                       propsClone,
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
