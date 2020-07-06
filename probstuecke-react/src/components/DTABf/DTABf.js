import React from 'react'
import { Spinner } from 'react-bootstrap'
import CETEI from 'CETEIcean';
import { TEIRender, TEIRoute } from 'react-teirouter'
import Option from '../Option'
import EventEmitter from '../EventEmitter'
import LinkToIndex from './LinkToIndex'
import MusicExample from './MusicExample'
import Overlay from './Overlay'
import Glyph from './Glyph'
import TextSettings from './TextSettings'
import MetadataModal from './MetadataModal'
import HeaderContext from './HeaderContext'
import { faFont } from '@fortawesome/free-solid-svg-icons'
import './DTABf.scss'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    'teiHeader': undefined
  })
  return ct.getHTML5(`/data/${file}`)
}

const Header = React.forwardRef((props, ref) => (
  <div hidden>
    <div ref={ref} className="teiMetadata">
      {props.children}
    </div>
  </div>
));

class DTABf extends React.Component {
  state = {
    diplomatic: true
  }

  headerRef = React.createRef()

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
          <HeaderContext.Provider value={this.headerRef}>
            <MetadataModal />
          </HeaderContext.Provider>
          <Option toggle
                  icon={faFont}
                  onClick={() => {
                    this.setState({
                      diplomatic: !this.state.diplomatic
                    })
                  }}/>
        </div>

        <div className={this.state.diplomatic ? 'diplomatic' : 'modernized'}>
          <TextSettings.Provider value={this.state.diplomatic}>
            <TEIRender data={this.state.teiData} path={this.props.tei}>
              <TEIRoute el='tei-notatedmusic' component={MusicExample}/>
              <TEIRoute el='tei-ref' component={Overlay}/>
              <TEIRoute el='tei-teiheader'>
                <Header ref={this.headerRef}/>
              </TEIRoute>
              <TEIRoute el='tei-g' component={Glyph}/>
              <TEIRoute el='tei-persname'>
                <LinkToIndex type='indexOfPersons'/>
              </TEIRoute>
              <TEIRoute el='tei-bibl'>
                <LinkToIndex type='bibliography'/>
              </TEIRoute>
              <TEIRoute el='tei-name'>
                <LinkToIndex type='indexOfMusicalWorks'/>
              </TEIRoute>
            </TEIRender>
          </TextSettings.Provider>
        </div>
      </>
    )
  }
}

export default DTABf;
