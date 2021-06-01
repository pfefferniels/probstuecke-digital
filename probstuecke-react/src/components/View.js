import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Spinner, Tabs, Tab, Container, Col, Row } from 'react-bootstrap'
import { TOC } from './TOC'
import Score from './Score/Score'
import DTABf from './Text/DTABf/DTABf'
import P5 from './Text/P5/P5'
import { faImages } from '@fortawesome/free-solid-svg-icons'
import Option from './Option'
import Settings from './Settings'
import ScoreContext from './ScoreContext'
import { useParams } from 'react-router-dom'

const View = () => {
  const { t } = useTranslation()
  const { piece } = useParams()

  const toc = useContext(TOC)
  const [diplomatic, setDiplomatic] = useState(false)
  const [showFacsimile, setShowFacsimile] = useState(false)
  const [scoreRef, setScoreContext] = useState(null)
  const [dummy, setDummy] = useState(0)

  if (!toc.ready) return <Spinner animation='grow'/>

  return (
    <>
      <div className='options'>
        <Option toggle
                icon={faImages}
                onClick={() => {setShowFacsimile(!showFacsimile)}}/>
        <Option toggle
                text={'D'}
               onClick={() => {setDiplomatic(!diplomatic)}}/>
      </div>

      <Tabs mountOnEnter={true}
            unmountOnExit={true}>
        {Object.entries(toc.data[piece].editions).map(([key,value]) => (
          <Tab key={`Tab_${key}`} eventKey={key} title={t(key)}>
              <div className={diplomatic ? 'diplomatic' : 'modernized'}>
                <Settings.Provider value={{diplomatic, showFacsimile}}>
                  <Container fluid>
                    <Row>
                      {value.score && (
                        <Col md={6}>
                          <Score scoreDidUpdate={(scoreRef) => {
                                   setDummy(scoreRef.innerHTML.length)
                                   setScoreContext(scoreRef)
                                 }}
                                 key={`Score_${key}`}
                                 mei={value.score}/>
                        </Col>
                      )}
                      {value.comments && (
                        <Col md={6}>
                          <ScoreContext.Provider value={scoreRef}>
                            {
                              {
                                'dtabf': <DTABf key={`Text_${key}`} tei={value.comments}/>,
                                'p5': <P5 key={`Text_${key}`} tei={value.comments}/>
                              }[value.format] || <Alert>No format specified</Alert>
                            }
                          </ScoreContext.Provider>
                        </Col>
                      )}
                    </Row>
                  </Container>
                </Settings.Provider>
              </div>
          </Tab>
        ))
        }
      </Tabs>
    </>
  )
}

export default View
