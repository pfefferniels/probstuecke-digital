import React, { useState, useEffect, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Row, Card, Spinner } from 'react-bootstrap'
import { incipitToolkit } from './Verovio'
import { TOC } from './../providers/TOC'
import './Welcome.scss'

const Incipit = ({ pae }) => {
  const [svg, setSVG] = useState(null)

  useEffect(() => {
    incipitToolkit.setOptions({
      inputFrom: 'pae',
      adjustPageHeight: true,
      pageMarginTop: 0,
      header: 'none',
      footer: 'none',
      svgViewBox: true
    })
    incipitToolkit.loadData(pae)
    setSVG(incipitToolkit.renderToSVG(1))
  }, [pae])

  if (!svg) {
    return <Spinner animation='grow' />
  }

  return <div className='incipit' dangerouslySetInnerHTML={{ __html: svg }} />
}

const Welcome = () => {
  const { t } = useTranslation()
  const toc = useContext(TOC)

  return (
    <div id='welcome'>
      <header className='header'>
        <p className='welcomeOverlay lead'>{t('welcome')}</p>
      </header>

      {!toc.ready ? (
        <Spinner animation='grow' />
      ) : (
        <Row className='mx-auto'>
          {Object.entries(toc.data).map(([key, value], i) => (
            <Card key={i} style={{ width: '25rem' }}>
              <Card.Body>
                <Card.Title>
                  <Link to={`/n${key}`}>{key}</Link>
                </Card.Title>
                <Incipit pae={value.incipit} />
                <div>
                  {Object.keys(value.editions).map((key, i) => (
                    <span className='contentEnum' key={i}>
                      {t(key)}
                    </span>
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))}
        </Row>
      )}
    </div>
  )
}

export default Welcome
