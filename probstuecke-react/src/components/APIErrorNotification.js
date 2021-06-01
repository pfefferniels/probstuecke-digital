import React from 'react'
import useAPIError from '../hooks/useAPIError'
import Alert from 'react-bootstrap/Alert'

function APIErrorNotification() {
  const { error, removeError } = useAPIError()

  const handleSubmit = () => {
    removeError()
  }

  return (
    <div>
      {error && error.message &&
        <Alert variant='warning'>
          {error.message}
        </Alert>}
    </div>
  )
}

export default APIErrorNotification
