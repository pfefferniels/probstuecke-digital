import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CardColumns, Card, Spinner } from 'react-bootstrap'
import { incipitToolkit } from './Verovio'
import { TOCConsumer } from './TOC'
import './Welcome.css'

class Incipit extends React.Component {
  state = {
    svg: null
  }

  componentDidMount() {
    incipitToolkit.setOptions({
      from: 'pae',
      adjustPageWidth: true,
      adjustPageHeight: true,
      footer: 'none',
      svgViewBox: true
    })
    incipitToolkit.loadData(this.props.pae)
    const svg = incipitToolkit.renderToSVG(1)
    this.setState({ svg })
  }

  render() {
    return this.state.svg ? <div className='incipit'
                                 dangerouslySetInnerHTML={{__html: this.state.svg}}/>
                          : <Spinner animation='grow'/>
  }
}


const Welcome = (props) => {
  const { t } = useTranslation()

  return (
    <div id='welcome'>
      <header className='header'>
        <p className='welcomeOverlay lead'>
          {t('welcome')}
        </p>
      </header>

      <TOCConsumer>
        {(toc) => (
          (!toc.ready) ? <Spinner animation='grow'/>
                       :
            <CardColumns>
              {Object.entries(toc.data).map(([key,value], i) => (
                <Card key={i} style={{width: '25rem'}}>
                  <Card.Body>
                    <Card.Title>
                      <Link to={`/${key}`}>
                        {key}
                      </Link>
                    </Card.Title>
                    <div>
                      {Object.keys(value.editions).map((key, i) => (
                        <span className='contentEnum'
                              key={i}>{t(key)}</span>
                      ))}
                    </div>
                    <Incipit pae={value.incipit}/>
                  </Card.Body>
                </Card>
                ))
              }
            </CardColumns>
          )}
      </TOCConsumer>
    </div>
  )
}

export default Welcome
