import { Link } from 'gatsby'
import React from 'react'

const LinkToIndex = (props: any) => {
  const corresp = props.teiNode.getAttribute('corresp')

  if (!corresp) {
    return <span className='targetlessLink'>{props.children}</span>
  }

  return (
    <Link to={`/${props.type}#${corresp.replace('#', '')}`}>
      <span id={props.teiNode.getAttribute('id') || 'unknown'}>{props.children}</span>
    </Link>
  )
}

export default LinkToIndex
