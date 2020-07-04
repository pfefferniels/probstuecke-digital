import React from 'react'
import { Spinner, Badge, ListGroup } from 'react-bootstrap'
import CETEI from 'CETEIcean'
import { TEIRoute, TEIRender } from '../TEI'
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
    <a target='_blank' rel='noopener noreferrer' href={ref}>
      <Badge pill variant='info'>
        &rarr; link to GND
      </Badge>
    </a>

  )
}

const EdiarumList = props => {
  return (
    <ListGroup variant='flush'>
      {props.children}
    </ListGroup>
  )
}

const EdiarumListItem = props => {
  return (
    <ListGroup.Item id={props.teiDomElement.getAttribute('xml:id')}>
      {props.children}
    </ListGroup.Item>
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
          <TEIRoute el='tei-listperson' component={EdiarumList}/>
          <TEIRoute el='tei-listbibl' component={EdiarumList}/>
          <TEIRoute el='tei-person' component={EdiarumListItem}/>
          <TEIRoute el='tei-bibl' component={EdiarumListItem}/>
          <TEIRoute el='tei-idno' component={EdiarumIdno}/>
        </TEIRender>
      </div>)
  }
}

export default EdiarumRegister;
