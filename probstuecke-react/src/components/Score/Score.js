import React from 'react'
import { scoreToolkit } from '../Verovio'
import { Spinner } from 'react-bootstrap'
import EventEmitter from '../EventEmitter'
import Settings from '../Settings'
import Option from '../Option'
import './Score.scss'

class Score extends React.Component {
  static contextType = Settings

  state = {
    diplomatic: this.context.diplomatic,
    svg: null
  }

  stavesAbove = 0
  embed = false
  scoreViewRef = React.createRef(null)

  async componentDidMount() {
    this.addStaff = this.addStaff.bind(this)
    this.removeStaff = this.removeStaff.bind(this)
    this.toggleEmbedding = this.toggleEmbedding.bind(this)
    this.fetchScore = this.fetchScore.bind(this)

    this.fetchScore()
  }

  async fetchScore() {
    const meiData = await fetch(
      `/data/${this.props.mei}?` +
      `above=${this.stavesAbove}&` +
      `modernClefs=${this.context.diplomatic ? 'off' : 'on'}&` +
      `showAnnotationStaff=${this.embed ? 'on' : 'off'}`
      ).then(response => response.text())

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

  addStaff() {
    this.stavesAbove = this.stavesAbove + 1
    this.fetchScore()
  }

  removeStaff() {
    this.stavesAbove = this.stavesAbove - 1
    this.fetchScore()
  }

  toggleEmbedding() {
    this.embed = !this.embed
    this.fetchScore()
  }

  componentDidUpdate() {
    if (document.getElementById('score-view')) {
      EventEmitter.dispatch('scoreIsReady', this.scoreViewRef)
    } else {
      console.error('This should not happen')
    }
  }

  render() {
    if (this.context.diplomatic !== this.state.diplomatic) {
      this.fetchScore()
      this.setState({
        diplomatic: this.context.diplomatic
      })
    }

    return (
      <>
        <div className='options'>
          <Option text={'+'}
                  onClick={this.addStaff}/>
          <Option text={'–'}
                  onClick={this.removeStaff}/>
          <Option toggle
                  text={'{}'}
                  onClick={this.toggleEmbedding}/>
        </div>

        <div>
          {
            this.state.svg
             ? <div ref={this.scoreViewRef}
                    className={this.context.diplomatic ? 'diplomatic' : 'modernized'}
                    id='score-view'
                    dangerouslySetInnerHTML={{__html: this.state.svg}}/>
             : <Spinner animation='grow'/>
          }
        </div>
      </>
    )
  }
}

export default Score
