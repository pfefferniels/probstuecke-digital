import React from 'react'
import { useState, useRef } from 'react'
import { Modal, Button, Overlay, Tooltip } from 'react-bootstrap'
import { Spinner, Tabs, Tab, Container, Col, Row } from 'react-bootstrap'
import EventEmitter from './EventEmitter'
import { TOCConsumer } from './TOC'
import Score from './Score/Score'
import DTABf from './DTABf/DTABf'

class View extends React.Component {
  state = {
    stavesAbove: 0,
    stavesBelow: 0
  }

  componentWillMount() {
    EventEmitter.subscribe('changeStavesAbove', (above) => {
      this.setState(prevState => ({
        ...prevState,
        stavesAbove: above
      }))
    })

    EventEmitter.subscribe('changeStavesBelow', (below) => {
      this.setState(prevState => ({
        ...prevState,
        stavesBelow: below
      }))
    })
  }

  render() {
    const { piece } = this.props.match.params

    return (
      <>
        <TOCConsumer>
          {(toc) => (
            (!toc.ready) ? <Spinner animation='grow'/>
                         :
              <Tabs mountOnEnter={true}
                    unmountOnExit={true}>
                {Object.entries(toc.data[piece].editions).map(([key,value],i) => (
                  <Tab key={i} eventKey={key} title={key}>
                    <Container fluid>
                      <Row>
                        {value.score && <Col md={6}>
                                          <Score key={`Score_${key}`}
                                                 mei={value.score}
                                                 stavesAbove={this.state.stavesAbove}
                                                 stavesBelow={this.state.stavesBelow}/>
                                        </Col>}
                        {value.comments && <Col md={6}>
                                             <DTABf key={`Text_${key}`} tei={value.comments}/>
                                           </Col>}
                      </Row>
                    </Container>
                  </Tab>
                  ))
                }
              </Tabs>
            )}
        </TOCConsumer>
      </>
    )
  }
}

export default View
