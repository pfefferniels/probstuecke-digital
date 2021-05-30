import React, { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { Badge, ListGroup } from 'react-bootstrap'
import { TEIRoute, TEIRender } from 'react-teirouter'
import { apiUrl } from '../../../config.js'
import './EdiarumRegister.scss'
import CETEI from 'CETEIcean'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    'teiHeader': undefined
  })
  return ct.getHTML5(file)
}

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

const EdiarumRegister = props => {
  const [teiData, setTeiData] = useState(null)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const data = await teiToHtml(`${apiUrl}/${props.tei}`)
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
