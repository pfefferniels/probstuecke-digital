import React from 'react'
import EdiarumRegister from './Text/EdiarumRegister/EdiarumRegister'

const Index = (props) => (
  <div id='index'>
    <EdiarumRegister tei={`indices/${props.type}.xml`}/>
  </div>)

export default Index
