import React from 'react'
import { Link } from 'react-router-dom'

class Person extends React.Component {
  personRef = React.createRef()

  componentDidMount() {
    this.personRef.current.appendChild(this.props.teiDomElement)
  }

  render() {
    const corresp = this.props.teiDomElement.getAttribute('corresp')
    return corresp ? <Link to={`/indexOfPersons${corresp}`}
                           ref={this.personRef}/>
                   : <span className='unreferencedPerson'
                           ref={this.personRef}/>
  }
}

export default Person
