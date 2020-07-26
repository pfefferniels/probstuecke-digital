import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Spinner, Tabs, Tab, Container, Col, Row } from 'react-bootstrap'
import { TOC } from './TOC'
import Score from './Score/Score'
import DTABf from './Text/DTABf/DTABf'
import P5 from './Text/P5/P5'
import {IIIFProvider} from './IIIF'
import { faImages } from '@fortawesome/free-solid-svg-icons'
import Option from './Option'
import Settings from './Settings'
import ScoreContext from './ScoreContext'

const View = (props) => {
  const { t } = useTranslation()
  const { piece } = props.match.params

  const toc = React.useContext(TOC)
  const [diplomatic, setDiplomatic] = React.useState(false)
  const [showFacsimile, setShowFacsimile] = React.useState(false)
  const [scoreRef, setScoreContext] = React.useState(null)
  const [dummy, setDummy] = React.useState(0)

  return ((!toc.ready)
      ? <Spinner animation='grow'/>
      :  <>
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
             {Object.entries(toc.data[piece].editions).map(([key,value],i) => (
               <Tab key={i} eventKey={key} title={t(key)}>
                 <IIIFProvider iiif={value.iiif}>
                   <div className={diplomatic ? 'diplomatic' : 'modernized'}>
                     <Settings.Provider value={{diplomatic, showFacsimile}}>
                       <Container fluid>
                         <Row>
                           {value.score && <Col md={6}>
                                               <Score scoreDidUpdate={(scoreRef) => {
                                                        setDummy(scoreRef.innerHTML.length)
                                                        setScoreContext(scoreRef)
                                                      }}
                                                      key={`Score_${key}`}
                                                      mei={value.score}/>
                                           </Col>}
                           {value.comments && (
                             <Col md={6}>
                               <ScoreContext.Provider value={scoreRef}>
                                 {(() => {
                                   switch (value.format) {
                                     case 'dtabf':
                                       return <DTABf key={`Text_${key}`}
                                                     tei={value.comments}/>
                                     case 'p5':
                                       return <P5 key={`Text_${key}`}
                                                  tei={value.comments}/>
                                     default:
                                       return <Alert>No format specified</Alert>
                                   }
                                 })()}
                               </ScoreContext.Provider>
                             </Col>
                           )}
                         </Row>
                       </Container>
                     </Settings.Provider>
                   </div>
                 </IIIFProvider>
               </Tab>
             ))
             }
           </Tabs>
         </>
     )
}

export default View
