import React, { useState, useContext } from 'react'
import { Spinner } from 'react-bootstrap'
import { Button, Badge, ListGroup } from 'react-bootstrap'
import { TEIRoute, TEIRender } from 'react-teirouter'
import { useHistory } from 'react-router-dom'
import { TOC } from '../../../providers/TOC'
import { useAPIError, useTEI, useNavigation } from '../../../hooks'
import { useTranslation } from 'react-i18next'
import { apiUrl } from '../../../config.js'
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
  return <ListGroup variant='flush'>{children}</ListGroup>
}

const EdiarumListItem = ({ teiNode, children }) => {
  const { t } = useTranslation()
  const { addError } = useAPIError()
  const history = useHistory()
  const toc = useContext(TOC)
  const { navigateTo } = useNavigation(toc, history)
  const [references, setReferences] = useState([])
  const xmlId = teiNode.getAttribute('xml:id')

  const fetchReferences = async () => {
    try {
      const response = await fetch(`${apiUrl}/references/${xmlId}`)
      const data = await response.json()
      if (!data.references) {
        console.log('no references found')
        return
      }
      setReferences(
        Array.isArray(data.references)
          ? data.references // multiple refs
          : [data.references] // exactly one result
      )
    } catch (e) {
      console.log('failed fetching references', e)
    }
  }

  return (
    <ListGroup.Item id={xmlId}>
      {children}

      <Button variant='link' onClick={() => fetchReferences()}>
        {t('viewOccurences')}
      </Button>
      {references.map((ref, i) => {
        return (
          <div key={`referenceOn${xmlId}_${i}`}>
            <Button variant='link' onClick={() => navigateTo(ref.path)}>
              {ref.title}
            </Button>
          </div>
        )
      })}
    </ListGroup.Item>
  )
}

const EdiarumRegister = ({ tei }) => {
  const { addError } = useAPIError()
  const { teiData } = useTEI(tei, addError)

  if (!teiData) {
    return <Spinner animation='grow' />
  }

  return (
    <div className='ediarumRegister'>
      <TEIRender data={teiData}>
        <TEIRoute el='tei-listperson' component={EdiarumList} />
        <TEIRoute el='tei-listbibl' component={EdiarumList} />
        <TEIRoute el='tei-person' component={EdiarumListItem} />
        <TEIRoute el='tei-bibl' component={EdiarumListItem} />
        <TEIRoute el='tei-idno' component={EdiarumIdno} />
      </TEIRender>
    </div>
  )
}

export default EdiarumRegister
