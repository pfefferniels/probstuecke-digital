import React from 'react'
import { Translation } from 'react-i18next'
import { Alert, Spinner } from 'react-bootstrap'
import { exampleToolkit } from '../Verovio'
import './NotatedMusic.scss'

class NotatedMusic extends React.Component {
  state = {
    error: false
  }

  async componentDidMount() {
    const filename = this.props.teiDomElement.querySelector('tei-ptr').getAttribute('target')
    if (!filename) {
      this.setState({
        error: true
      })
    }

    const meiData = await fetch(`${this.props.teiPath}/${filename}`).then(response => response.text()).catch(error => this.setState({error}))

    exampleToolkit.setOptions({
      pageHeight: 60000,
      adjustPageHeight: true,
      footer: 'none'
    })
    exampleToolkit.loadData(meiData)
    const svg = exampleToolkit.renderToSVG(1)
    this.setState({meiData, svg: svg})
  }

  render() {
    if (this.state.error) {
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
          this.state.svg
           ? <div className='notatedMusic' dangerouslySetInnerHTML={{__html: this.state.svg}}/>
           : <Spinner animation='grow'/>
        }
      </div>)
  }
}

export default NotatedMusic
