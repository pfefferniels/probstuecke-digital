import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { Button, Spinner, Navbar, Nav, NavDropdown, Form, FormControl } from 'react-bootstrap'
import { useHistory } from "react-router-dom"
import { LinkContainer } from 'react-router-bootstrap'
import { TOC } from './../providers/TOC'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLanguage } from '@fortawesome/free-solid-svg-icons'

const Navigation = () => {
  const [searchString, setSearchString] = useState('')
  const history = useHistory()
  const { t } = useTranslation()

  const changeLanguage = lng => {
    i18n.changeLanguage(lng)
  }

  const handleChange = e => {
    setSearchString(e.target.value)
  }

  const handleKey = e => {
    if (e.key === 'Enter') {
      history.push(`/search/${searchString}`)
    }
  }

  return (
      <Navbar>
        <LinkContainer to='/'>
          <Navbar.Brand>Probstücke Digital</Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <LinkContainer to='guidelines'>
            <Nav.Link>{t('editionGuidelines')}</Nav.Link>
          </LinkContainer>
          <NavDropdown title="Probstücke" id='basic-nav-dropdown'>
            <TOC.Consumer>
              {(toc) => (
                (!toc.ready) ? <Spinner animation='grow'/>
                             : Object.keys(toc.data).map(key => (
                                <LinkContainer key={`n${key}`} to={`/n${key}`}>
                                  <NavDropdown.Item>{key}</NavDropdown.Item>
                                </LinkContainer>
                               ))
              )}
            </TOC.Consumer>
          </NavDropdown>
          <NavDropdown title={t('indices')}>
            <LinkContainer to='/indexOfPersons'>
              <NavDropdown.Item key='indexOfPersons'>{t('indexOfPersons')}</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to='/bibliography'>
              <NavDropdown.Item key='bibliography'>{t('bibliography')}</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to='/indexOfMusicalWorks'>
              <NavDropdown.Item key='indexOfMusicalWorks'>{t('indexOfMusicalWorks')}</NavDropdown.Item>
            </LinkContainer>
          </NavDropdown>
        </Nav>

        <Form inline>
          <FormControl
            type='text'
            placeholder={t('search')}
            onChange={handleChange}
            onKeyPress={handleKey} />
        </Form>

        <NavDropdown
          alignRight
          title={
            <FontAwesomeIcon size='2x' icon={faLanguage} />
          }>
          <NavDropdown.Item onClick={() => changeLanguage('en')}>
            {t('english')}
          </NavDropdown.Item>
          <NavDropdown.Item onClick={() => changeLanguage('de')}>
            {t('german')}
          </NavDropdown.Item>
        </NavDropdown>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default Navigation
