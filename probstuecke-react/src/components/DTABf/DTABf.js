import React from 'react';
import { Spinner } from 'react-bootstrap';
import CETEI from 'CETEIcean';
import { TEIRender, TEIRoute } from '../TEI.js'
import EventEmitter from '../EventEmitter.js'
import EditorialNote from './EditorialNote.js'
import Person from './Person.js'
import MusicExample from './MusicExample.js'
import Overlay from './Overlay.js'
import './DTABf.css'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    handlers: {
      'teiHeader': undefined
    }
  });
  return ct.getHTML5(`/data/${file}`)
}

class Header extends React.Component {
  constructor(props) {
    super(props)
    EventEmitter.dispatch('metadataAvailable', props.teiDomElement)
  }

  render() {
    return (null)
  }
}

class DTABf extends React.Component {
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
      <TEIRender data={this.state.teiData} path={this.props.tei}>
        <TEIRoute el='tei-note' component={EditorialNote}/>
        <TEIRoute el='tei-persname' component={Person}/>
        <TEIRoute el='tei-notatedmusic' component={MusicExample}/>
        <TEIRoute el='tei-ref' component={Overlay}/>
        <TEIRoute el='tei-header' component={Header}/>
      </TEIRender>
    )
  }
}

export default DTABf;
