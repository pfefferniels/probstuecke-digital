import React, { useState, useCallback } from 'react'

export const APIErrorContext = React.createContext({
  error: null,
  addError: () => {},
  removeError: () => {}
})

export default function APIErrorProvider({ children }) {
  const [error, setError] = useState(null)

  const removeError = () => setError(null)

  const addError = (message, status) => setError({ message, status })

  const contextValue = {
    error,
    addError: useCallback((message, status) => addError(message, status), []),
    removeError: useCallback(() => removeError(), [])
  }

  return (
    <APIErrorContext.Provider value={contextValue}>
      {children}
    </APIErrorContext.Provider>
  );
}
