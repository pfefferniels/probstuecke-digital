import React from 'react';
import { Spinner, Badge, Card, CardColumns } from 'react-bootstrap';
import CETEI from 'CETEIcean';
import { TEIRoute, TEIRender } from '../TEI.js'
import './EdiarumRegister.scss'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    handlers: {
      'teiHeader': undefined
    }
  });
  return ct.getHTML5(`/data/${file}`)
}

const EdiarumIdno = (props) => {
  const ref = props.teiDomElement.innerText
  if (!ref) return <span>{props.teiDomElement.innerHTML}</span>

  return (
    <a target='_blank' rel="noopener noreferrer" href={ref}>
      <Badge pill variant='info'>
        &rarr; link to GND
      </Badge>
    </a>

  )
}

const EdiarumListPerson = props => {
  return (
    <CardColumns className='personList'>
      {props.children}
    </CardColumns>
  )
}

const EdiarumPerson = props => {
  return (
    <Card className='person'>
      {props.children}
    </Card>
  )
}

class EdiarumRegister extends React.Component {
  state = {}

  async componentDidMount() {
    const teiData = await teiToHtml(this.props.tei)
    this.setState({
      teiData
    })
  }

  render() {
    if (!this.state.teiData) {
      return <Spinner animation='grow'/>
    }

    return (
      <div className='ediarumRegister'>
        <TEIRender data={this.state.teiData} path={this.props.tei}>
          <TEIRoute el='tei-person' component={EdiarumPerson}/>
          <TEIRoute el='tei-idno' component={EdiarumIdno}/>
          <TEIRoute el='tei-listperson' component={EdiarumListPerson}/>
        </TEIRender>
      </div>)
  }
}

export default EdiarumRegister;
