import React from 'react'
import useAPIError from '../hooks/useAPIError'
import Alert from 'react-bootstrap/Alert'
import './APIErrorNotification.scss'

function APIErrorNotification() {
  const { error, removeError } = useAPIError()

  return (
    <div className="notification">
      {error && error.message &&
        <Alert variant={error.status} dismissible onClose={()=>removeError()}>
          {error.message}
        </Alert>}
    </div>
  )
}

export default APIErrorNotification
