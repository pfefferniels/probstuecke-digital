import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Spinner } from 'react-bootstrap'
import './Overlay.css'
import EventEmitter from './EventEmitter.js'

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
  constructor(props) {
    super(props)
    this.state = {
      targets: []
    }

    this.connectedSVGOverlays = []
    this.underlyingText = React.createRef()
    this.highlight = this.highlight.bind(this)
  }

  componentDidMount() {
    if (!this.props.teiRef.hasAttribute('target')) {
      return;
    }

    let targets = this.props.teiRef.getAttribute('target').split(' ')

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
    this.underlyingText.current.appendChild(this.props.teiRef.firstChild)
  }

  highlight() {
    const domEl = this.underlyingText.current
    domEl.scrollIntoView()
    domEl.addEventListener('animationend', () => domEl.classList.remove('blink'))
    domEl.classList.add('blink')
  }

  render() {
    if (!this.props.teiRef.hasAttribute('target')) {
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
