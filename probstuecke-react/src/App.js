import React, { Suspense } from 'react'
import { Spinner } from 'react-bootstrap'
import { HashRouter, Switch, Route } from 'react-router-dom'
import { TOCProvider } from './components/TOC'
import Navigation from './components/Navigation'
import View from './components/View'
import Index from './components/Index'
import Welcome from './components/Welcome'
import Search from './components/Search'
import P5 from './components/Text/P5/P5'
import './App.css'

const App = props => (
  <HashRouter hashType="noslash">
        <TOCProvider>
          <Suspense fallback={<Spinner animation='border' />}>
            <div className='App'>
              <Navigation />

              <Switch>
                <Route path='/indexOfPersons'>
                  <Index type='persons'/>
                </Route>
                <Route path='/bibliography'>
                  <Index type='bibliography'/>
                </Route>
                <Route path='/indexOfMusicalWorks'>
                  <Index type='musical-works'/>
                </Route>
                <Route path='/guidelines'>
                  <P5 tei='guidelines'/>
                </Route>
                <Route path='/n:piece' component={View} />
                <Route path='/search/:q' component={Search} />
                <Route path='/' component={Welcome} />
              </Switch>
            </div>
          </Suspense>
        </TOCProvider>
      </HashRouter>
)

export default App
