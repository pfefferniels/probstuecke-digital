import React, { Suspense } from 'react'
import { Spinner } from 'react-bootstrap'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { TOCProvider } from './components/TOC'
import Navigation from './components/Navigation'
import View from './components/View'
import Index from './components/Index'
import Welcome from './components/Welcome'
import P5 from './components/P5/P5'
import './App.css'

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
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
                <Route path='/:piece' component={View} />
                <Route path='/' component={Welcome} />
              </Switch>
            </div>
          </Suspense>
        </TOCProvider>
      </BrowserRouter>
    )
  }
}

export default App;
