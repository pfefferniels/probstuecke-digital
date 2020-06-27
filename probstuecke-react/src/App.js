import React from 'react';
import { BrowserRouter, Switch, Route } from "react-router-dom"
import { TOCProvider } from './components/TOC.js'
import Navigation from './components/Navigation.js'
import View from './components/View.js'
import Index from './components/Index.js'
import Welcome from './components/Welcome.js'
import './App.css';

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <TOCProvider>
          <div className="App">
            <Navigation />

              <Switch>
                <Route path='/indexOfPersons'>
                  <Index type='persons'/>
                </Route>
                <Route path='/:piece' component={View} />
                <Route path='/' component={Welcome} />
              </Switch>
          </div>
        </TOCProvider>
      </BrowserRouter>
)
  }
}

export default App;
