import React from 'react'
import TextSettings from './TextSettings'

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
        <TextSettings.Consumer>
          {(diplomatic) => {
            switch (this.state.type) {
              case 'long-s':
                return diplomatic ? <span>ſ</span> : <span>s</span>
              case 'umlaut-o':
                return diplomatic ? <span>oͤ</span> : <span>ö</span>
              case 'umlaut-a':
                return diplomatic ? <span>aͤ</span> : <span>ä</span>
              case 'umlaut-u':
                return diplomatic ? <span>uͤ</span> : <span>ü</span>
              default:
                return <span className='unknownGlyph'>{this.props.children}</span>
            }
          }}
        </TextSettings.Consumer>
      </span>
    )
  }
}

export default Glyph
