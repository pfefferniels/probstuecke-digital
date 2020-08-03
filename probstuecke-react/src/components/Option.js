import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Option.scss'

const Option = props => {
  const [active, setActive] = useState(false)

  const _onClick = () => {
    if (props.toggle) setActive(!active)
    if (props.onClick) props.onClick()
  }

  return (
    <>
      {props.icon && <FontAwesomeIcon className={`optionIcon ${active ? 'active' : 'inactive'}`}
                                      icon={props.icon}
                                      size='lg'
                                      onClick={_onClick}
                                      ref={props.ref}/>}
      {props.text && <span className={`optionText ${active ? 'active' : 'inactive'}`}
                           onClick={_onClick}
                           ref={props.ref}>{props.text}</span>}

      {props.children}
    </>
  )
}

export default Option
