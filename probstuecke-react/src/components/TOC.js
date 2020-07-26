import React, { createContext } from 'react'

const TOC = createContext();

class TOCProvider extends React.Component {
  state = {
    data: null,
    ready: false,
    error: null
  }

  componentDidMount() {
    fetch('/toc.json')
      .then(response => response.json())
      .then(data => this.setState(prevState => ({
        ...prevState,
        data: data,
        ready: true
      })))
      .catch(error => {
        console.log(error)
        this.setState({
          error, ready: false
        })
      })
  }

  render () {
    return <TOC.Provider value={this.state}>{this.props.children}</TOC.Provider>
  }
}

export {
  TOCProvider,
  TOC
}
