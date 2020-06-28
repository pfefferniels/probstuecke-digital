import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Spinner } from 'react-bootstrap'
import EventEmitter from '../EventEmitter'
import './Overlay.scss'

class SVGOverlay extends Component {
  constructor(props) {
    super(props)

    this.rectRef = React.createRef()
  }

  highlight() {
    const domEl = this.rectRef.current

    domEl.scrollIntoView()
    domEl.addEventListener('animationend', () => domEl.classList.remove('blink'))
    domEl.classList.add('blink')
  }

  render() {
    const targetEl = this.props.target
    const bbox = targetEl.getBBox()
    return (<rect ref={this.rectRef}
                  className='targetOverlay'
                  width={bbox.width}
                  height={bbox.height}
                  x={bbox.x}
                  y={bbox.y}
                  onClick={this.props.onClick}/>)
  }
}

class Overlay extends Component {
  state = {
    targets: []
  }
  connectedSVGOverlays = []
  underlyingText = React.createRef()

  componentDidMount() {
    this.highlight = this.highlight.bind(this)

    if (!this.props.teiDomElement.hasAttribute('target')) {
      return;
    }

    const targets = this.props.teiDomElement.getAttribute('target').split(' ')

    // Wait for the score view to finish loading
    EventEmitter.subscribe('scoreIsReady', (scoreView) => {
      targets.forEach(target => {
        let targetEl = scoreView.current.querySelector(target)
        if (!targetEl) {
          console.warn('This should not have happened.', target)
        } else {
          this.setState(prevState => ({
            targets: [...prevState.targets, targetEl]
          }))
        }
      })
    })
  }

  componentDidUpdate() {
    if (!this.underlyingText.current) return
    this.underlyingText.current.appendChild(this.props.teiDomElement.firstChild)
  }

  highlight() {
    const domEl = this.underlyingText.current
    domEl.scrollIntoView()
    domEl.addEventListener('animationend', () => domEl.classList.remove('blink'))
    domEl.classList.add('blink')
  }

  render() {
    if (!this.props.teiDomElement.hasAttribute('target')) {
      return <span className='targetlessRef' ref={this.underlyingText}/>
    }

    const targets = this.state.targets
    if (targets.length === 0) {
      return <Spinner animation='grow'/>
    }

    return (
      <>
        {targets.map(target => (
          ReactDOM.createPortal((
            <SVGOverlay ref={node => this.connectedSVGOverlays.push(node)}
                        target={target}
                        onClick={this.highlight}/>),
            target)
         ))}
        <span ref={this.underlyingText}
              className='overlay'
              onClick={() => {
                this.connectedSVGOverlays.forEach(targetOverlay => {
                  if (targetOverlay) {
                    targetOverlay.highlight()
                  }
                })
              }} />
      </>
    )
  }
}

export default Overlay;
