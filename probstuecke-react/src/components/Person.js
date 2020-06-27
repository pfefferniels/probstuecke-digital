import React from 'react'
import { Link } from 'react-router-dom'

class Person extends React.Component {
  constructor(props) {
    super(props)
    this.personRef = React.createRef()
  }

  componentDidMount() {
    this.personRef.current.appendChild(this.props.teiPersName)
  }

  render() {
    const corresp = this.props.teiPersName.getAttribute('corresp')
    return corresp ? <Link to={`/indexOfPersons${corresp}`}
                           ref={this.personRef}/>
                   : <span className='unreferencedPerson'
                           ref={this.personRef}/>
  }
}

export default Person
