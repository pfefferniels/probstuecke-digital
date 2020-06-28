import React from 'react'
import TEIElement from './TEIElement.js'

const TEIRoutes = React.createContext()

class TEIRender extends React.Component {
  availableRoutes = []
  routes = {}

  constructor(props) {
    super(props)

    props.children.forEach(route => {
      this.availableRoutes.push(route.props.el)
      this.routes[route.props.el] = route.props.component
    })
  }

  render() {
    return (
      <TEIRoutes.Provider value={this.routes}>
        <TEIElement teiDomElement={this.props.data}
                    teiPath={this.props.path}
                    availableRoutes={this.availableRoutes}/>
      </TEIRoutes.Provider>
    )
  }
}

class TEIRoute extends React.Component {
  render() {
    return (null)
  }
}

export { TEIRender, TEIRoute, TEIRoutes }
