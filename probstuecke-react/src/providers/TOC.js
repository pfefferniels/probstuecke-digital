import React, { createContext, useEffect, useState } from 'react'
import api from '../api'

const TOC = createContext()

const TOCProvider = ({ children }) => {
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = () => {
      api.get('/toc')
       .then(response => {
         if (response.ok) {
           setData(response.data)
           setReady(true)
         } else {
           setError(response.problem)
           setReady(false)
         }
       })
    }

    fetchData()
  }, [])

  return <TOC.Provider value={{data, ready, error}}>{children}</TOC.Provider>
}

export {
  TOCProvider,
  TOC
}
