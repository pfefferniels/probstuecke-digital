import React, { useState, useRef, useEffect } from 'react'
import { TEIRoute, TEIRender } from 'react-teirouter'
import { Alert, Spinner } from 'react-bootstrap'
import { useAPIError, useTEI } from '../../../hooks'
import { useTranslation } from 'react-i18next'
import { Header, MetadataModal, Reference } from '..'
import { apiUrl } from '../../../config.js'
import { exampleToolkit } from '../../Verovio'
import './LessonTranscription.scss'

const Transcription = ({ path, url }) => {
  const { addError } = useAPIError()
  const { t } = useTranslation()

  const [error, setError] = useState(false)
  const [svg, setSVG] = useState(null)

  if (!url) {
    setError(true)
  }

  useEffect(() => {
    const fetchMEI = async () => {
      try {
        const data = await fetch(`${apiUrl}/mei?path=${path}/${url}`)
        const text = await data.text()

        exampleToolkit.setOptions({
          pageHeight: 60000,
          adjustPageHeight: true,
          footer: 'none',
        })
        exampleToolkit.loadData(text)
        const svg = exampleToolkit.renderToSVG(1)
        setSVG(svg)
      } catch (e) {
        addError(`${t('renderError')}: ${e}`)
        setError(true)
      }
    }

    fetchMEI()
  }, [url])

  if (error) {
    return <Alert>{t('renderError')}</Alert>
  }

  if (!svg) {
    return <Spinner animation='grow' />
  }

  return (
    <div className='notatedMusic' dangerouslySetInnerHTML={{ __html: svg }} />
  )
}

const Audio = ({ path, url }) => {
  return (
    <audio
      className='embeddedAudio'
      style={{
        display: 'block',
      }}
      controls
    >
      <source src={`${apiUrl}/media?path=${path}/${url}`} />
    </audio>
  )
}

const Utterance = ({ teiNode, children }) => {
  return <p class='utterance'>{children}</p>
}

const Ptr = ({ teiNode, path, children }) => {
  const type = teiNode.getAttribute('type')
  const url = teiNode.getAttribute('target')

  if (type === 'audio') {
    return <Audio path={path} url={url} />
  } else if (type === 'transcription') {
    return <Transcription path={path} url={url} />
  }

  return <span class='ptr'>{children}</span>
}

const LessonTranscription = ({ tei }) => {
  const headerRef = useRef()
  const { addError } = useAPIError()
  const { teiPath, teiData } = useTEI(tei, addError)

  if (!teiData) {
    return <Spinner animation='grow' />
  }

  return (
    <>
      <div className='options'>
        <MetadataModal headerRef={headerRef} />
      </div>

      <div className='lessonTranscription'>
        <TEIRender data={teiData}>
          <TEIRoute el='tei-teiheader'>
            <Header ref={headerRef} />
          </TEIRoute>
          <TEIRoute el='tei-u' component={Utterance} />
          <TEIRoute el='tei-ptr'>
            <Ptr path={teiPath} />
          </TEIRoute>
          <TEIRoute el='tei-ref' component={Reference} />
        </TEIRender>
      </div>
    </>
  )
}

export default LessonTranscription
