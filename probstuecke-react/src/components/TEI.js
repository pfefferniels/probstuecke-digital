import React from 'react'
import TEIElement from './TEIElement'
import warning from 'tiny-warning'

const TEIRoutes = React.createContext()

class TEIRoute extends React.Component {
  componentDidMount() {
    warning(!this.props.children,
      'Children components are not supported yet. Use the component prop instead.')
  }

  render() {
    return (null)
  }
}

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

export { TEIRender, TEIRoute, TEIRoutes }
