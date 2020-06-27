import React from 'react';
import { Spinner, Badge } from 'react-bootstrap';
import CETEI from 'CETEIcean';
import TEIElement from './TEIElement.js'
import EventEmitter from './EventEmitter.js'
import './EdiarumRegister.css'

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
    <Badge pill variant='info'>
      <a target='_blank' rel="noopener noreferrer" href={ref}>
        &rarr; link to GND
      </a>
    </Badge>
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
      <div className='index'>
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
