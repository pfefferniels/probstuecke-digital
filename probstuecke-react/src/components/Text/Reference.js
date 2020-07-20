import React from 'react'
import Overlay from './Overlay'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

const Reference = (props) => {
  const target = props.teiDomElement.getAttribute('target')

  if (!target) {
    return (
      <span className='targetlessRef'>
        {props.children}
      </span>
    )
  }

  if (target.startsWith('#')) {
    return (
      <Overlay target={target}>{props.children}</Overlay>
    )
  }

  if (/(http(s?)):\/\//i.test(target)) {
    return (
      <span>
        <a target='_blank' rel='noopener noreferrer' href={target}>
          {props.children} <small><FontAwesomeIcon icon={faExternalLinkAlt} /></small>
        </a>
      </span>
    )
  }
}

export default Reference
