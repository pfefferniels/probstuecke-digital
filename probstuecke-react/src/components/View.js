import React from 'react'
import { Translation } from 'react-i18next'
import { Spinner, Tabs, Tab, Container, Col, Row } from 'react-bootstrap'
import { TOCConsumer } from './TOC'
import Score from './Score/Score'
import DTABf from './DTABf/DTABf'
import {IIIFProvider} from './IIIF'
import { faImages } from '@fortawesome/free-solid-svg-icons'
import Option from './Option'
import Settings from './Settings'

class View extends React.Component {
  state = {
    diplomatic: false,
    showFacsimile: false
  }

  render() {
    const { piece } = this.props.match.params

    return (
      <TOCConsumer>
        {(toc) => (
          (!toc.ready) ? <Spinner animation='grow'/>
                       :
            <>
              <div className='options'>
                <Option toggle
                        icon={faImages}
                        onClick={() => {
                          this.setState({
                            showFacsimile: !this.state.showFacsimile
                          })
                        }}/>
                <Option toggle
                        text={'D'}
                        onClick={() => {
                          this.setState({
                            diplomatic: !this.state.diplomatic
                          })
                        }}/>
              </div>

              <Translation>
                {(t, {i18n}) => (
                  <Tabs mountOnEnter={true}
                        unmountOnExit={true}>
                    {Object.entries(toc.data[piece].editions).map(([key,value],i) => (
                      <Tab key={i} eventKey={key} title={t(key)}>
                        <IIIFProvider iiif={value.iiif}>
                          <div className={this.state.diplomatic ? 'diplomatic' : 'modernized'}>
                            <Settings.Provider value={{
                                diplomatic: this.state.diplomatic,
                                showFacsimile: this.state.showFacsimile}}>
                              <Container fluid>
                                <Row>
                                  {value.score && <Col md={6}>
                                                      <Score key={`Score_${key}`}
                                                             mei={value.score}/>
                                                  </Col>}
                                  {value.comments && <Col md={6}>
                                                       <DTABf key={`Text_${key}`}
                                                              tei={value.comments}/>
                                                     </Col>}
                                </Row>
                              </Container>
                            </Settings.Provider>
                          </div>
                        </IIIFProvider>
                      </Tab>
                    ))
                    }
                  </Tabs>
                )}
              </Translation>
            </>
          )}
      </TOCConsumer>
    )
  }
}

export default View
