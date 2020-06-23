import React from 'react'
import { Spinner, Navbar, Nav, NavDropdown, Form, FormControl, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { TOCConsumer } from './TOC.js'

const Navigation = () => {
    return (
      <Navbar>
        <Navbar.Brand>
          <Link to='/'>Probstücke Digital</Link>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href='/guidelines'>Edition Guidelines</Nav.Link>
          <NavDropdown title="Probstücke" id="basic-nav-dropdown">
            <TOCConsumer>
              {(toc) => (
                (!toc.ready) ? <Spinner animation='grow'/>
                             : Object.keys(toc.data).map(key => (
                               <NavDropdown.Item>
                                 <Link to={`/${key}`}>{key}</Link>
                               </NavDropdown.Item>
                             ))
              )}
            </TOCConsumer>
          </NavDropdown>
          <NavDropdown title='Indices'>
            <NavDropdown.Item>Persons</NavDropdown.Item>
            <NavDropdown.Item>Musical Works</NavDropdown.Item>
            <NavDropdown.Item>Bibliography</NavDropdown.Item>
          </NavDropdown>
        </Nav>
        <Form inline>
          <FormControl type="text" placeholder="Search" className="mr-sm-2" />
            <Button variant="outline-success">Search</Button>
          </Form>
        </Navbar.Collapse>
      </Navbar>
    )
}

export default Navigation;
