import React, { createContext, useEffect, useState } from 'react'
import { apiUrl } from '../config'

const TOC = createContext();

const TOCProvider = props => {
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData () {
      try {
        const response = await fetch(`${apiUrl}/toc`);
        const json = await response.json();
        setData(json);
        setReady(true)
      } catch (error) {
        console.error(error);
        setError(error);
        setReady(false);
      }
    }

    fetchData();
  }, []);

  return <TOC.Provider value={{data, ready, error}}>{props.children}</TOC.Provider>
}

export {
  TOCProvider,
  TOC
}
