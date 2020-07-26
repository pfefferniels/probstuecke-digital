import React from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner, Navbar, Nav, NavDropdown, Form, FormControl } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { TOC } from './TOC'

const Navigation = () => {
  const { t } = useTranslation()

  return (
      <Navbar>
        <Navbar.Brand>
          <Link to='/'>Probstücke Digital</Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href='/guidelines'>{t('editionGuidelines')}</Nav.Link>
          <NavDropdown title="Probstücke" id="basic-nav-dropdown">
            <TOC.Consumer>
              {(toc) => (
                (!toc.ready) ? <Spinner animation='grow'/>
                             : Object.keys(toc.data).map(key => (
                               <NavDropdown.Item>
                                 <Link to={`/${key}`}>{key}</Link>
                               </NavDropdown.Item>
                             ))
              )}
            </TOC.Consumer>
          </NavDropdown>
          <NavDropdown title={t('indices')}>
            <NavDropdown.Item key='indexOfPersons'>
              <Link to='indexOfPersons'>{t('indexOfPersons')}</Link>
            </NavDropdown.Item>
            <NavDropdown.Item key='bibliography'>
              <Link to='bibliography'>{t('bibliography')}</Link>
            </NavDropdown.Item>
            <NavDropdown.Item key='indexOfMusicalWorks'>
              <Link to='indexOfMusicalWorks'>{t('indexOfMusicalWorks')}</Link>
            </NavDropdown.Item>
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
