import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Option.scss'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

const Option = (props) => {
  const [active, setActive] = useState(false)

  const _onClick = () => {
    if (props.toggle) setActive(!active)
    if (props.onClick) props.onClick()
  }

  let button = null
  if (props.icon) {
    button = (
      <FontAwesomeIcon
        className={`optionIcon ${active ? 'active' : 'inactive'}`}
        icon={props.icon}
        size='lg'
        onClick={_onClick}
        ref={props.ref}
      />
    )
  } else if (props.text) {
    button = (
      <span
        className={`optionText ${active ? 'active' : 'inactive'}`}
        onClick={_onClick}
        ref={props.ref}
      >
        {props.text}
      </span>
    )
  }

  return (
    <>
      <OverlayTrigger
        placement={'bottom'}
        overlay={
          <Tooltip>
            {props.tooltip ? props.tooltip : <span>empty</span>}
          </Tooltip>
        }
      >
        {button}
      </OverlayTrigger>

      {props.children}
    </>
  )
}

export default Option
