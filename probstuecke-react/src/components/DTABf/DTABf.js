import React from 'react'
import { Spinner } from 'react-bootstrap'
import { TEIRender, TEIRoute } from 'react-teirouter'
import CETEI from 'CETEIcean'
import { faImages } from '@fortawesome/free-solid-svg-icons'
import Option from '../Option'
import LinkToIndex from './LinkToIndex'
import MusicExample from './MusicExample'
import Overlay from './Overlay'
import Glyph from './Glyph'
import MetadataModal from './MetadataModal'
import Paragraph from './Paragraph'
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
    showFacsimile: false,
    diplomatic: false
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
          <MetadataModal headerRef={this.headerRef}/>
        </div>

        <TEIRender data={this.state.teiData} path={this.props.tei}>
          <TEIRoute el='tei-p' component={Paragraph}/>
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
      </>
    )
  }
}

export default DTABf;
