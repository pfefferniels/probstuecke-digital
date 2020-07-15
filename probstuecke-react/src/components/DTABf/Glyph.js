import React from 'react'
import Settings from '../Settings'

class Glyph extends React.Component {
  state = {
    invalidType: false,
    type: ''
  }

  componentDidMount() {
    const type = this.props.teiDomElement.getAttribute('type')
    if (!type) {
      this.setState({
        invalidType: true
      })
    } else {
      this.setState({
        type: type
      })
    }
  }

  render() {
    return (
      <span className='specialGlyph'>
        <Settings.Consumer>
          {(settings) => {
            switch (this.state.type) {
              case 'long-s':
                return settings.diplomatic ? <span>ſ</span> : <span>s</span>
              case 'umlaut-o':
                return settings.diplomatic ? <span>oͤ</span> : <span>ö</span>
              case 'umlaut-a':
                return settings.diplomatic ? <span>aͤ</span> : <span>ä</span>
              case 'umlaut-u':
                return settings.diplomatic ? <span>uͤ</span> : <span>ü</span>
              default:
                return <span className='unknownGlyph'>{this.props.children}</span>
            }
          }}
        </Settings.Consumer>
      </span>
    )
  }
}

export default Glyph
