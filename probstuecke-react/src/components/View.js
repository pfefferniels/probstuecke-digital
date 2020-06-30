import React from 'react'
import { Spinner, Tabs, Tab, Container, Col, Row } from 'react-bootstrap'
import { TOCConsumer } from './TOC'
import Score from './Score/Score'
import DTABf from './DTABf/DTABf'

const View = props => {
  const { piece } = props.match.params

  return (
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
                                             mei={value.score}/>
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
  )
}

export default View
