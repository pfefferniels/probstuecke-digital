import React from 'react'
import { TEIRender, TEIRoute } from 'react-teirouter'
import LinkToIndex from './LinkToIndex'
import NotatedMusic from './NotatedMusic'
import Overlay from './Overlay'
import Glyph from './Glyph'
import MetadataModal from './MetadataModal'
import Paragraph from './Paragraph'
import './DTABf.scss'

const Header = React.forwardRef((props, ref) => (
  <div hidden>
    <div ref={ref} className="teiMetadata">
      {props.children}
    </div>
  </div>
));

class DTABf extends React.Component {
  headerRef = React.createRef()

  render() {
    return (
      <>
        <div className='options'>
          <MetadataModal headerRef={this.headerRef}/>
        </div>

        <TEIRender tei={`data/${this.props.tei}`}>
          <TEIRoute el='tei-p' component={Paragraph}/>
          <TEIRoute el='tei-notatedmusic' component={NotatedMusic}/>
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

export default DTABf
