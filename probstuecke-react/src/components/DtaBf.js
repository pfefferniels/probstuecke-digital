import React from 'react';
import { Spinner } from 'react-bootstrap';
import CETEI from 'CETEIcean';
import TEIElement from './TEIElement.js'
import EventEmitter from './EventEmitter.js'
import EditorialNote from './EditorialNote.js'
import Person from './Person.js'
import MusicExample from './MusicExample.js'
import Overlay from './Overlay.js'
import './DtaBf.css'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    handlers: {
      'teiHeader': undefined
    }
  });
  return ct.getHTML5(`/data/${file}`)
}

class DtaBf extends React.Component {
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

    return <TEIElement teiDomElement={this.state.teiData}
                       teiPath={this.props.tei}

                       onNote={(el) => <EditorialNote teiNote={el}/>}
                       onPersName={(el) => <Person teiPersName={el}/>}
                       onNotatedMusic={(el) => <MusicExample teiNotatedMusic={el} teiPath={this.props.tei}/>}
                       onRef={(el) => <Overlay teiRef={el}/>}
                       onTeiHeader={(el) => {
                         EventEmitter.dispatch('metadataAvailable', el)
                         return (null)
                       }}/>
  }
}

export default DtaBf;
