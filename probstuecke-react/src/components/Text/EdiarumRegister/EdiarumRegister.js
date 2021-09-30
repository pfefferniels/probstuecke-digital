import React, { useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { Badge, ListGroup } from 'react-bootstrap'
import { TEIRoute, TEIRender } from 'react-teirouter'
import { useAPIError, useTEI } from '../../../hooks'
import './EdiarumRegister.scss'

const EdiarumIdno = ({ teiNode }) => {
  const ref = teiNode.innerText
  if (!ref) return <span>{teiNode.innerHTML}</span>

  return (
    <a target='_blank' rel='noopener noreferrer' href={ref}>
      <Badge pill variant='info'>
        &rarr; link to GND
      </Badge>
    </a>
  )
}

const EdiarumList = ({ children }) => {
  return (
    <ListGroup variant='flush'>
      {children}
    </ListGroup>
  )
}

const EdiarumListItem = ({teiNode, children}) => {
  return (
    <ListGroup.Item id={teiNode.getAttribute('xml:id')}>
      {children}
    </ListGroup.Item>
  )
}

const EdiarumRegister = ({tei}) => {
  const { addError } = useAPIError()
  const { teiData } = useTEI(tei, addError)

  if (!teiData) {
    return <Spinner animation='grow' />
  }

  return (
    <div className='ediarumRegister'>
      <TEIRender data={teiData}>
        <TEIRoute el='tei-listperson' component={EdiarumList}/>
        <TEIRoute el='tei-listbibl' component={EdiarumList}/>
        <TEIRoute el='tei-person' component={EdiarumListItem}/>
        <TEIRoute el='tei-bibl' component={EdiarumListItem}/>
        <TEIRoute el='tei-idno' component={EdiarumIdno}/>
      </TEIRender>
    </div>
  )
}

export default EdiarumRegister
