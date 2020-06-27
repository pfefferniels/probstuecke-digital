import React from 'react';
import { Spinner, Badge } from 'react-bootstrap';
import CETEI from 'CETEIcean';
import TEIElement from './TEIElement.js'
import EventEmitter from './EventEmitter.js'
import './EdiarumRegister.scss'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    handlers: {
      'teiHeader': undefined
    }
  });
  return ct.getHTML5(`/data/${file}`)
}

const EdiarumIdno = (props) => {
  const ref = props.teiIdno.innerText
  if (!ref) return <span>{props.teiIdno.innerHTML}</span>

  return (
    <a target='_blank' rel="noopener noreferrer" href={ref}>
      <Badge pill variant='info'>
        &rarr; link to GND
      </Badge>
    </a>

  )
}

class EdiarumRegister extends React.Component {
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
      <div className='ediarumRegister'>
        <TEIElement teiDomElement={this.state.teiData}
                    teiPath={this.props.tei}
                    onIdno={(el) => <EdiarumIdno teiIdno={el}/>}
                    onTeiHeader={(el) => {
                      EventEmitter.dispatch('metadataAvailable', el)
                      return (null)
                    }}/>
      </div>)
  }
}

export default EdiarumRegister;
