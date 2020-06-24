import React from 'react'
import Text from './Text.js'

class Index extends React.Component {

  render() {
    return (
      <div id='index'>
        <Text tei={`indices/${this.props.type}.xml`}/>
      </div>)
  }
}

export default Index
