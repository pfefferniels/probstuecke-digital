import React, { useRef, useEffect, useContext } from 'react'
import { TEIRender, TEIRoute } from 'react-teirouter'
import { Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Header, LinkToIndex, MetadataModal, NotatedMusic, Reference } from '..'
import { apiUrl } from '../../../config.js'
import { useAPIError, useTEI } from '../../../hooks'
import Paragraph from './Paragraph'
import Settings from '../../Settings'
import './DTABf.scss'

const DTABf = ({tei}) => {
  const { t } = useTranslation()
  const { addError } = useAPIError()
  const { diplomatic, showFacsimile } = useContext(Settings)
  const { teiPath, teiData } = useTEI(tei, addError, !diplomatic)
  const headerRef = useRef()
  const zonesRef = useRef()

  useEffect(() => {
    const fetchFacsimile = async () => {
      try {
        const data = await fetch(`${apiUrl}/tei-facsimile?path=${tei}`)
        const json = await data.json()
        if (showFacsimile && json.zones.length === 0) {
          addError(t('noFacsimile'), 'info')
          return
        }
        zonesRef.current = json.zones
      } catch (e) {
        addError(`${t('errorLoading')}: ${e}`, 'warning')
      }
    }

    if (showFacsimile && !zonesRef.current) {
      fetchFacsimile()
    }
  }, [showFacsimile])

  if (!teiData) {
    return <Spinner animation='grow'/>
  }

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef}/>
      </div>

      <TEIRender data={teiData}>
        <TEIRoute el='tei-p'>
          <Paragraph zonesRef={zonesRef}/>
        </TEIRoute>
        <TEIRoute el='tei-notatedmusic'>
          <NotatedMusic path={teiPath}/>
        </TEIRoute>
        <TEIRoute el='tei-ref' component={Reference}/>
        <TEIRoute el='tei-teiheader'>
          <Header ref={headerRef}/>
        </TEIRoute>
        <TEIRoute el='tei-persname'>
          <LinkToIndex type='indexOfPersons'/>
        </TEIRoute>
        <TEIRoute el='tei-bibl'>
          <LinkToIndex type='bibliography'/>
        </TEIRoute>
        <TEIRoute el='tei-name'>
          <LinkToIndex type='indexOfMusicalWorks'/>
        </TEIRoute>
      </TEIRender>
    </>
  )
}

export default DTABf
