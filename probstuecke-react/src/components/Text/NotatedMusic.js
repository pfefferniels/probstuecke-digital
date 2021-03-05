import React, { useState, useEffect } from 'react'
import { Translation } from 'react-i18next'
import { Alert, Spinner } from 'react-bootstrap'
import { exampleToolkit } from '../Verovio'
import { apiUrl } from '../../config.js'
import './NotatedMusic.scss'

const NotatedMusic = props => {
  const [error, setError] = useState(false)
  const [meiData, setMEIData] = useState(null)
  const [svg, setSVG] = useState(null)

  const filename = props.teiDomElement.querySelector('tei-ptr').getAttribute('target')
  if (!filename) {
    setError(true)
  }

  useEffect(() => {
    const fetchMEI = async () => {
      try {
        console.log(`${apiUrl}/mei/${props.teiPath}/${filename}`)
        const data = await fetch(`${apiUrl}/mei/${props.teiPath}/${filename}`)
        const text = await data.text()

        exampleToolkit.setOptions({
          pageHeight: 60000,
          adjustPageHeight: true,
          footer: 'none'
        })
        exampleToolkit.loadData(text)
        const svg = exampleToolkit.renderToSVG(1)
        setMEIData(text)
        setSVG(svg)
      } catch (e) {
        console.log('failed fetching MEI: ', e)
        setError(true)
      }
    }

    fetchMEI()
  }, [])

  if (error) {
    return (
      <Translation>
        {(t, i18n) => (
          <Alert>{t('renderError')}</Alert>
        )}
      </Translation>
    )
  }

  return (
    <div>
      {
        svg
         ? <div className='notatedMusic' dangerouslySetInnerHTML={{__html: svg}}/>
         : <Spinner animation='grow'/>
      }
    </div>)
}

export default NotatedMusic
