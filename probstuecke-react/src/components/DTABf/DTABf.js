import React from 'react';
import { Spinner } from 'react-bootstrap';
import CETEI from 'CETEIcean';
import { TEIRender, TEIRoute } from '../TEI'
import Option from '../Option'
import EventEmitter from '../EventEmitter'
import EditorialNote from './EditorialNote'
import Person from './Person'
import MusicExample from './MusicExample'
import Overlay from './Overlay'
import Glyph from './Glyph'
import TextSettings from './TextSettings'
import MetadataModal from './MetadataModal'
import { faFont } from '@fortawesome/free-solid-svg-icons'
import './DTABf.css'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    'teiHeader': undefined
  })
  return ct.getHTML5(`/data/${file}`)
}

class Header extends React.Component {
  constructor(props) {
    super(props)
    EventEmitter.dispatch('metadataAvailable', props.teiDomElement.firstChild)
  }

  render() {
    return (null)
  }
}

class DTABf extends React.Component {
  state = {
    diplomatic: true
  }

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
      <>
        <div className='options'>
          <MetadataModal />
          <Option toggle
                  icon={faFont}
                  onClick={() => {
                    this.setState({
                      diplomatic: !this.state.diplomatic
                    })
                  }}/>
        </div>

        <TextSettings.Provider value={this.state.diplomatic}>
          <TEIRender data={this.state.teiData} path={this.props.tei}>
            <TEIRoute el='tei-note' component={EditorialNote}/>
            <TEIRoute el='tei-persname' component={Person}/>
            <TEIRoute el='tei-notatedmusic' component={MusicExample}/>
            <TEIRoute el='tei-ref' component={Overlay}/>
            <TEIRoute el='tei-teiheader' component={Header}/>
            <TEIRoute el='tei-g' component={Glyph}/>
          </TEIRender>
        </TextSettings.Provider>
      </>
    )
  }
}

export default DTABf;
