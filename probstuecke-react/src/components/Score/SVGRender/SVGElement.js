import React from 'react'
import SVGRoutes from './SVGRoutes'

const attrMapping = {
  'stroke-width': 'strokeWidth',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'font-style': 'fontStyle',
  'xlink:href': 'xlinkHref',
  'class': 'className',
  'text-anchor': 'textAnchor',
  'xmlns:xlink': 'xmlnsXlink'
}

const reactAttrFor = attrName => attrMapping[attrName] ? attrMapping[attrName] : attrName

const SVGElement = (props) => {
  const forwardSvgAttributes = () => (
    Array.from(props.svgDomElement.attributes).reduce((acc, attr) => {
      acc[reactAttrFor(attr.name)] = attr.value
      return acc
    }, {}))

  const el = props.svgDomElement
  const tagName = el.tagName.toLowerCase()
  const className = el.getAttribute('class')

  const svgChildren = Array.from(el.childNodes).map((svgEl, i) => {
    switch (svgEl.nodeType) {
      case Node.ELEMENT_NODE:
        return (
          <SVGElement key={`${svgEl.tagName}${i}`}
                      svgDomElement={svgEl}
                      availableRoutes={props.availableRoutes}/>)
      case Node.TEXT_NODE:
        return svgEl.nodeValue
      default:
        return null
    }
  })

  if (props.availableRoutes.includes(className)) {
    const propsClone = {
      ...props,
      svgDomElement: props.svgDomElement.cloneNode(true)
    }

    return (
      <SVGRoutes.Consumer>
        {(routes) => {
          const selectedRoute = routes[className]

          // Routes can be given as child elements that are
          // created already and need to be cloned here,
          // or as a component, that is not yet instantiated.
          if (React.isValidElement(selectedRoute)) {
            return React.cloneElement(selectedRoute,
                                      {...propsClone},
                                      svgChildren)
          }

          return React.createElement(selectedRoute,
                                     propsClone,
                                     svgChildren)
        }}
      </SVGRoutes.Consumer>
    )
  }

  return React.createElement(tagName,
                             {...forwardSvgAttributes()},
                             svgChildren)
}

export default SVGElement
