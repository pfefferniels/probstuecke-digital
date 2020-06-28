import React from 'react'
import path from 'path'
import { Alert, Spinner } from 'react-bootstrap'
import { exampleToolkit } from '../Verovio'
import './MusicExample.css'

class MusicExample extends React.Component {
  state = {
    error: false
  }

  async componentDidMount() {
    let filename = this.props.teiDomElement.querySelector('tei-ptr').getAttribute('target')
    let directory = path.dirname(this.props.teiPath)
    let targetPath = `/data/${directory}/${filename}`
    const meiData = await fetch(targetPath).then(response => response.text()).catch(error => this.setState({error}))

    exampleToolkit.setOptions({
      pageHeight: 60000,
      adjustPageHeight: 1,
      footer: 'none'
    })
    exampleToolkit.loadData(meiData)
    let svg = exampleToolkit.renderToSVG(1)
    this.setState({meiData, svg: svg})
  }

  render() {
    if (this.state.error) {
      return <Alert>An error occured while rendering an embedded music example.</Alert>
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

export default MusicExample;
