import React, { Component, useEffect, useContext, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Spinner } from 'react-bootstrap'
import Settings from '../Settings'
import ScoreContext from '../ScoreContext'
import './Overlay.scss'

const highlight = (domEl, scroll) => {
  if (!domEl) return

  if (scroll) {
    domEl.scrollIntoView()
  }
  domEl.addEventListener('animationend', () => {
    if (domEl) domEl.classList.remove('blink')
  })
  domEl.classList.add('blink')
}

class SVGOverlay extends Component {
  rectRef = React.createRef()

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

const Overlay = (props) => {
  const { showFacsimile } = useContext(Settings)
  const scoreRef = useContext(ScoreContext)
  const underlyingText = useRef()
  const targets = props.target.split(' ')
  const connectedSVGOverlays = []
  const highlightTargets = scroll => {
    connectedSVGOverlays.forEach(targetOverlay => {
      if (targetOverlay) targetOverlay.highlight(scroll)
    })
  }

  useEffect(() => {
    if (!underlyingText.current) return

    underlyingText.current.addEventListener('click', () => highlightTargets(true))
    underlyingText.current.addEventListener('mouseover', () => highlightTargets(false))
  })

  if (!scoreRef) return <Spinner animation='border'/>

  // do not display overlays in facsimile mode
  if (showFacsimile) return <span>{props.children}</span>

  return (
    <>
    {
      targets.map((target, i) => {
        const targetEl = scoreRef.querySelector(target)
        if (!targetEl) return null

        return ReactDOM.createPortal((
          <SVGOverlay ref={node => connectedSVGOverlays.push(node)}
                      target={targetEl}
                      onClick={() => highlight(underlyingText.current, true)}
                      onHover={() => highlight(underlyingText.current, false)}/>),
          targetEl)
      })
    }

    <span ref={underlyingText} className='overlay'>
      {props.children}
    </span>
    </>
  )
}

export default Overlay
