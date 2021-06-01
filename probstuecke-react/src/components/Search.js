import React, { useState, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import { apiUrl } from '../config'
import './Search.scss'

const Search = () => {
  const [results, setResults] = useState(null)
  const { q } = useParams()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await fetch(`${apiUrl}/search/${q}`)
        const json = await data.json()
        setResults(json.results)
      } catch (e) {
        console.log('error fetching search results:', e)
      }
    }

    fetchResults()
  }, [q])

  if (!results) {
    return <Spinner animation='grow' />
  }

  return (
    <div id='searchResults'>
      {results.map((result) => {
        return (
          <div className='result'>
            <b className='title'>{result.title}</b>
            <p className='summary' dangerouslySetInnerHTML={{__html: result.summary}} />
          </div>
        )
      })}
    </div>
  )
}

export default Search
