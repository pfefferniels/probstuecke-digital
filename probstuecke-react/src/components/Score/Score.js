import React from 'react'
import { scoreToolkit } from '../Verovio'
import { Spinner } from 'react-bootstrap'
import EventEmitter from '../EventEmitter'
import AccidentalsModal from './AccidentalsModal'
import FacsimileModal from './FacsimileModal'
import Option from '../Option'
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'
import './Score.css'

class Score extends React.Component {
  state = {
    svg: null
  }
  stavesAbove = 0

  scoreViewRef = React.createRef(null)

  async componentDidMount() {
    this.addStaff = this.addStaff.bind(this)
    this.removeStaff = this.removeStaff.bind(this)
    this.fetchScore = this.fetchScore.bind(this)

    this.fetchScore()
  }

  async fetchScore() {
    const meiData = await fetch(
      `/data/${this.props.mei}?above=${this.stavesAbove}`
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

  componentDidUpdate() {
    if (document.getElementById('score-view')) {
      EventEmitter.dispatch('scoreIsReady', this.scoreViewRef)
    } else {
      console.error('This should not happen')
    }
  }

  render() {
    return (
      <>
        <div className='options'>
          <AccidentalsModal />
          <FacsimileModal />
          <Option icon={faPlus}
                  onClick={this.addStaff}/>
          <Option icon={faMinus}
                  onClick={this.removeStaff}/>
        </div>

        <div>
          {
            this.state.svg
             ? <div ref={this.scoreViewRef} id='score-view' dangerouslySetInnerHTML={{__html: this.state.svg}}/>
             : <Spinner animation='grow'/>
          }
        </div>
      </>
    )
  }
}

export default Score;
