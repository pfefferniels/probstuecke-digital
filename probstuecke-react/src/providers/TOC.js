import React, { createContext, useEffect, useState } from 'react'
import { apiUrl } from '../config'

const TOC = createContext()

const TOCProvider = ({ children }) => {
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}/toc`)
        const data = await response.json()
        if (!data) {
          setError('failed fetching TOC')
          setReady(true)
          return
        }

        setData(data)
        setReady(true)
      } catch (e) {
        setError(`failed fetching TOC: ${e}`)
        setReady(true)
      }
    }

    fetchData()
  }, [])

  return <TOC.Provider value={{ data, ready, error }}>{children}</TOC.Provider>
}

export { TOCProvider, TOC }
