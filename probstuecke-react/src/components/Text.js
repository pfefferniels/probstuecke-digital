import React from 'react';
import { Spinner } from 'react-bootstrap';
import CETEI from 'CETEIcean';
import TEIElement from './TEIElement.js'
import './Text.css'

class Text extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  async componentDidMount() {
    const ct = new CETEI()

    ct.addBehaviors({
      handlers: {
        'teiHeader': undefined
      }
    });

    const teiData = await ct.getHTML5(`/data/${this.props.tei}`)
    this.setState({
      teiData
    })
  }

  render() {
    return (
      <>
      {
        this.state.teiData ? <TEIElement teiDomElement={this.state.teiData} teiPath={this.props.tei} />
                           : <Spinner animation='grow'/>
      }
      </>)
  }
}

export default Text;
