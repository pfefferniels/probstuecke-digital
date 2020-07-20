import React from 'react'
import { Badge, ListGroup } from 'react-bootstrap'
import { TEIRoute, TEIRender } from 'react-teirouter'
import './EdiarumRegister.scss'

const EdiarumIdno = (props) => {
  const ref = props.teiDomElement.innerText
  if (!ref) return <span>{props.teiDomElement.innerHTML}</span>

  return (
    <a target='_blank' rel='noopener noreferrer' href={ref}>
      <Badge pill variant='info'>
        &rarr; link to GND
      </Badge>
    </a>

  )
}

const EdiarumList = props => {
  return (
    <ListGroup variant='flush'>
      {props.children}
    </ListGroup>
  )
}

const EdiarumListItem = props => {
  return (
    <ListGroup.Item id={props.teiDomElement.getAttribute('xml:id')}>
      {props.children}
    </ListGroup.Item>
  )
}

const EdiarumRegister = (props) => (
  <div className='ediarumRegister'>
    <TEIRender tei={`data/${props.tei}`}>
      <TEIRoute el='tei-listperson' component={EdiarumList}/>
      <TEIRoute el='tei-listbibl' component={EdiarumList}/>
      <TEIRoute el='tei-person' component={EdiarumListItem}/>
      <TEIRoute el='tei-bibl' component={EdiarumListItem}/>
      <TEIRoute el='tei-idno' component={EdiarumIdno}/>
    </TEIRender>
  </div>
)

export default EdiarumRegister
