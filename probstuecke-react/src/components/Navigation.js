import React from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner, Navbar, Nav, NavDropdown, Form, FormControl } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { TOC } from './TOC'

const Navigation = () => {
  const { t } = useTranslation()

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
          <NavDropdown title="Probstücke" id="basic-nav-dropdown">
            <TOC.Consumer>
              {(toc) => (
                (!toc.ready) ? <Spinner animation='grow'/>
                             : Object.keys(toc.data).map(key => (
                                <LinkContainer to={`/n${key}`}>
                                  <NavDropdown.Item>{key}</NavDropdown.Item>
                                </LinkContainer>
                               ))
              )}
            </TOC.Consumer>
          </NavDropdown>
          <NavDropdown title={t('indices')}>
            <LinkContainer to='indexOfPersons'>
              <NavDropdown.Item key='indexOfPersons'>{t('indexOfPersons')}</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to='bibliography'>
              <NavDropdown.Item key='bibliography'>{t('bibliography')}</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to='indexOfMusicalWorks'>
              <NavDropdown.Item key='indexOfMusicalWorks'>{t('indexOfMusicalWorks')}</NavDropdown.Item>
            </LinkContainer>
          </NavDropdown>
        </Nav>
        <Form inline>
          <FormControl type="text" placeholder="Search" className="mr-sm-2" />
        </Form>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default Navigation;
