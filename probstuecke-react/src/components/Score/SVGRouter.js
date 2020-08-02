import React, { useRef, useEffect, useState } from 'react'
import warning from 'tiny-warning'
import ReactDOM from 'react-dom'
import { Spinner } from 'react-bootstrap'

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

const SVGRouter = props => {
  const scoreViewRef = useRef(null)
  const [portals, setPortals] = useState([])

  useEffect(() => {
    if (!scoreViewRef.current || portals.length !== 0) return

    let preparedPortals = []
    React.Children.forEach(props.children, route => {
      const selector = route.props.for
      if (!selector) return

      const targets = scoreViewRef.current.querySelectorAll(selector)
      if (!targets) return

      targets.forEach(target => {
        if (!route.props.component) return

        preparedPortals.push(
          ReactDOM.createPortal(
            React.createElement(route.props.component,
                                {svgDomElement: target}),
            target))
      })
    })
    setPortals(preparedPortals)
  }, [portals.length, props.children])

  if (!props.svg) return <Spinner />

  return (
      <>
        <div ref={scoreViewRef}
             id='scoreView'
             dangerouslySetInnerHTML={{__html: props.svg}}/>
        {portals}
      </>
  )
}

export { SVGRouter, SVGRoute }
