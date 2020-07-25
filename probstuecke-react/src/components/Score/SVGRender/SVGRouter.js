import React from 'react'
import warning from 'tiny-warning'
import SVGElement from './SVGElement'
import SVGRoutes from './SVGRoutes'

class SVGRoute extends React.Component {
  componentDidMount() {
    warning(!(this.props.children && this.props.component),
      `You should not use child elements and the component attribute
       at the same time.`)
  }

  render() {
    return (null)
  }
}

const SVGRender = props => {
  const svgData = new DOMParser().parseFromString(props.svg, 'image/svg+xml')
  const availableRoutes = []
  const routes = {}

  React.Children.forEach(props.children, route => {
    availableRoutes.push(route.props.el)
    if (route.props.children) {
      routes[route.props.el] = route.props.children
    } else {
      routes[route.props.el] = route.props.component
    }
  })

  return (
    <SVGRoutes.Provider value={routes}>
      <SVGElement svgDomElement={svgData.documentElement}
                  availableRoutes={availableRoutes}/>
    </SVGRoutes.Provider>
  )
}

export { SVGRender, SVGRoute }
