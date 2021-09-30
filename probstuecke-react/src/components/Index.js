import React from 'react'
import EdiarumRegister from './Text/EdiarumRegister/EdiarumRegister'
import { useParams } from 'react-router-dom'

const Index = (props) => {
  const { key } = useParams()

  return (
    <div id='index'>
      <EdiarumRegister tei={`indices/${props.type}.xml`} activeItem={key} />
    </div>
  )
}

export default Index
