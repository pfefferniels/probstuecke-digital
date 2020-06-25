import React from 'react'
import { TOCConsumer } from './TOC.js'
import Score from './Score.js'
import Text from './Text.js'
import MetadataModal from './MetadataModal.js'
import AccidentalsModal from './AccidentalsModal.js'
import { Spinner, Tabs, Tab, Container, Col, Row } from 'react-bootstrap'

const Options = () => (
    <div id='options'>
      <MetadataModal />
      <AccidentalsModal />
    </div>)

class View extends React.Component {
  render() {
    const { piece } = this.props.match.params

    return (
      <>
        <Options />

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
                                          <Score key={`Score_${key}`} mei={value.score}/>
                                        </Col>}
                        {value.comments && <Col md={6}>
                                             <Text key={`Text_${key}`} tei={value.comments}/>
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
