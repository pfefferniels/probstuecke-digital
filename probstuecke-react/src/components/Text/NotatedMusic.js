import React, { useState, useEffect } from 'react'
import useAPIError from '../../hooks/useAPIError'
import { useTranslation } from 'react-i18next'
import { Alert, Spinner } from 'react-bootstrap'
import { exampleToolkit } from '../Verovio'
import { apiUrl } from '../../config.js'
import './NotatedMusic.scss'

const NotatedMusic = ({ teiNode, path }) => {
  const { addError } = useAPIError()
  const { t } = useTranslation()

  const [error, setError] = useState(false)
  const [svg, setSVG] = useState(null)

  const filename = teiNode.querySelector('tei-ptr').getAttribute('target')
  if (!filename) {
    setError(true)
  }

  useEffect(() => {
    const fetchMEI = async () => {
      try {
        const data = await fetch(`${apiUrl}/mei/${path}/${filename}`)
        const text = await data.text()

        exampleToolkit.setOptions({
          pageHeight: 60000,
          adjustPageHeight: true,
          footer: 'none'
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
  }, [filename])

  if (error) {
    return <Alert>{t('renderError')}</Alert>
  }

  if (!svg) {
    return <Spinner animation='grow'/>
  }

  return (
    <div className='notatedMusic' dangerouslySetInnerHTML={{__html: svg}}/>
  )
}

export default NotatedMusic
