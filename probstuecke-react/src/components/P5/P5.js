import React from 'react'
import { TEIRoute, TEIRender } from 'react-teirouter'
import Media from './Media'
import './P5.scss'

const P5 = (props) => (
  <div className='p5'>
    <TEIRender tei={`data/${props.tei}`}>
      <TEIRoute el='tei-teiHeader' component={()=>(null)}/>
      <TEIRoute el='tei-media' component={Media}/>
    </TEIRender>
  </div>
)

export default P5
