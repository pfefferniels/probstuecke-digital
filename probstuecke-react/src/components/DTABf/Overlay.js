import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Spinner } from 'react-bootstrap'
import EventEmitter from '../EventEmitter'
import './Overlay.scss'

const highlight = (domEl, scroll) => {
  if (scroll) {
    domEl.scrollIntoView()
  }
  domEl.addEventListener('animationend', () => domEl.classList.remove('blink'))
  domEl.classList.add('blink')
}

class SVGOverlay extends Component {
  constructor(props) {
    super(props)

    this.rectRef = React.createRef()
  }

  componentDidMount() {
    const domEl = this.rectRef.current

    domEl.addEventListener('mouseover', this.props.onHover)
    domEl.addEventListener('click', this.props.onClick)
  }

  highlight(scroll) {
    highlight(this.rectRef.current, scroll)
  }

  render() {
    const targetEl = this.props.target
    const bbox = targetEl.getBBox()
    return (<rect ref={this.rectRef}
                  className='targetOverlay'
                  width={bbox.width}
                  height={bbox.height}
                  x={bbox.x}
                  y={bbox.y}/>)
  }
}

class Overlay extends Component {
  state = {
    targets: []
  }

  scoreSubscription = null
  connectedSVGOverlays = []
  underlyingText = React.createRef()

  componentDidMount() {
    this._onScoreIsReady = this._onScoreIsReady.bind(this)
    this._highlightTargets = this._highlightTargets.bind(this)

    this.scoreSubscription =
      EventEmitter.subscribe('scoreIsReady', this._onScoreIsReady)
  }

  componentWillUnmount() {
    this.scoreSubscription.cancel()
  }

  _onScoreIsReady(scoreView) {
    if (!this.props.teiDomElement.hasAttribute('target')) {
      return;
    }

    const targets = this.props.teiDomElement.getAttribute('target').split(' ')
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
  }

  _highlightTargets(scroll) {
    this.connectedSVGOverlays.forEach(targetOverlay => {
      if (targetOverlay) {
        targetOverlay.highlight(scroll)
      }
    })
  }

  componentDidUpdate() {
    const underlyingText = this.underlyingText.current
    if (!underlyingText) return

    underlyingText.addEventListener('click', () => this._highlightTargets(true))
    underlyingText.addEventListener('mouseover', () => this._highlightTargets(false))
    underlyingText.innerHTML = this.props.teiDomElement.firstChild.innerHTML
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
                        onClick={() => highlight(this.underlyingText.current, true)}
                        onHover={() => highlight(this.underlyingText.current, false)}/>),
            target)
         ))}
        <span ref={this.underlyingText}
              className='overlay'/>
      </>
    )
  }
}

export default Overlay;
