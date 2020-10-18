import React, { useEffect, useState } from 'react'
import { API } from 'aws-amplify'
import { Spinner } from 'react-bootstrap'
import { Badge, ListGroup } from 'react-bootstrap'
import { TEIRoute, TEIRender } from 'react-teirouter'
import path from 'path'
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

const EdiarumRegister = (props) => {
  const [teiData, setTeiData] = useState(null)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const data = await API.get(
          'probstueckeBackend',
          `/load/data/${props.tei}`,
          {responseType: 'xml'})
        setTeiData(data)
      } catch (e) {
        console.log('failed fetching TEI:', e)
      }
    }

    fetchTEI()
  })

  if (!teiData) {
    return <Spinner animation='grow' />
  }

  return (
    <div className='ediarumRegister'>
      <TEIRender teiData={teiData} path={path.dirname(props.tei)}>
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
