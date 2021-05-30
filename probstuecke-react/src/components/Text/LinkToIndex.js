import React from 'react'
import { Link } from 'react-router-dom'

const LinkToIndex = (props) => {
  const corresp = props.teiNode.getAttribute('corresp')

  if (!corresp) {
    return (
      <span className='targetlessLink'>
        {props.children}
      </span>
    )
  }

  return (
    <Link to={`/${props.type}${corresp}`}>
      {props.children}
    </Link>
  )
}

export default LinkToIndex
