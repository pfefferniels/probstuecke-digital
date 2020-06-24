import React from 'react'
import { Link } from 'react-router-dom'

class Person extends React.Component {
  constructor(props) {
    super(props)
    this.personRef = React.createRef()
  }

  componentDidMount() {
    this.personRef.current.appendChild(this.props.teiEl)
  }

  render() {
    const corresp = this.props.teiEl.getAttribute('corresp')
    return <Link to={`/indexOfPersons${corresp}`}
                 ref={this.personRef}/>
  }
}

export default Person
