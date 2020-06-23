import React from 'react';
import { scoreToolkit } from './Verovio.js';
import { Spinner } from 'react-bootstrap';
import './Score.css'
import EventEmitter from './EventEmitter.js'

class Score extends React.Component {
  constructor(props) {
    super(props)
    this.state = { }
    this.scoreViewRef = React.createRef(null)
  }

  async componentDidMount() {
    console.log('component did mount')
    const meiData = await fetch(`/data/${this.props.mei}`).then(response => response.text())

    scoreToolkit.setOptions({
      svgViewBox: true,
      adjustPageHeight: true,
      pageHeight: 60000,
      footer: 'none'
    })
    scoreToolkit.loadData(meiData)

    this.setState({
      meiData,
      svg: scoreToolkit.renderToSVG(1, {})
    })
  }


  componentDidUpdate() {
    if (document.getElementById('score-view')) {
      EventEmitter.dispatch('scoreIsReady', this.scoreViewRef)
    } else {
      console.error('This should not happen')
    }
  }

  render() {
    return (
      <div>
        {
          this.state.svg
           ? <div ref={this.scoreViewRef} id="score-view" dangerouslySetInnerHTML={{__html: this.state.svg}}/>
           : <Spinner animation='grow'/>
        }
      </div>)
  }
}

export default Score;
