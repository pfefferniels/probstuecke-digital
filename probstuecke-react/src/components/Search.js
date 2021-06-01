import React, { useState, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import { apiUrl } from '../config'
import useAPIError from '../hooks/useAPIError'
import './Search.scss'

const Search = () => {
  const [results, setResults] = useState(null)
  const [ready, setReady] = useState(false)
  const { q } = useParams()
  const { addError } = useAPIError()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await fetch(`${apiUrl}/search/${q}`)
        const json = await data.json()
        setResults(json.results)
        setReady(true)
      } catch (e) {
        addError(`Error fetching search results: ${e}`, e)
      }
    }

    fetchResults()
  }, [q, addError])

  if (!ready) {
    return <Spinner animation='grow' />
  }

  if (!results) {
    return <p>nothing found</p>
  }

  return (
    <div id='searchResults'>
      {results.map((result, i) => {
        return (
          <div key={`result${i}`} className='result'>
            <b className='title'>{result.title}</b>
            <p className='summary' dangerouslySetInnerHTML={{__html: result.summary}} />
          </div>
        )
      })}
    </div>
  )
}

export default Search
