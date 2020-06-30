import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Option.scss'

const Option = (props) => (
  <span className='option'>
    <FontAwesomeIcon style={{margin: '0.2rem'}}
                     icon={props.icon}
                     size='lg'
                     onClick={props.onClick}
                     ref={props.ref}/>

    {props.children}
  </span>
)

export default Option
