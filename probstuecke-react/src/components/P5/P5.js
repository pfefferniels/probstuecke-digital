import React from 'react'
import path from 'path'
import CETEI from 'CETEIcean'
import { Spinner } from 'react-bootstrap'
import { TEIRoute, TEIRender } from 'react-teirouter'
import Media from './Media'
import './P5.scss'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    handlers: {
      'teiHeader': undefined
    }
  });
  return ct.getHTML5(`/data/${file}`)
}

class P5 extends React.Component {
  state = {}

  async componentDidMount() {
    const teiData = await teiToHtml(this.props.tei)
    this.setState({
      teiData
    })
  }

  render() {
    if (!this.state.teiData) {
      return <Spinner animation='grow'/>
    }

    return (
      <div className='p5'>
        <TEIRender data={this.state.teiData} path={this.props.tei}>
          <TEIRoute el='tei-teiHeader' component={()=>(null)}/>
          <TEIRoute el='tei-media' component={Media}/>
        </TEIRender>
      </div>)
  }
}

export default P5
