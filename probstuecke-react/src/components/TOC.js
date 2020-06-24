import React, { createContext } from 'react'

const { Provider, Consumer: TOCConsumer } = createContext();

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
    const { children } = this.props
    return <Provider value={this.state}>{children}</Provider>
  }
}

export {
  TOCProvider,
  TOCConsumer
}
