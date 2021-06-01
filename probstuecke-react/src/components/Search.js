import React, { useState, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAPIError from '../hooks/useAPIError'
import { apiUrl } from '../config'
import './Search.scss'

const Search = () => {
  const [results, setResults] = useState(null)
  const [ready, setReady] = useState(false)
  const { q } = useParams()
  const { t } = useTranslation()
  const { addError } = useAPIError()

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await fetch(`${apiUrl}/search/${q}`)
        const json = await data.json()
        setResults(json.results)
        setReady(true)
      } catch (e) {
        addError(`Error fetching search results: ${e}`, 'warning')
      }
    }

    fetchResults()
  }, [q, addError])

  if (!ready) {
    return <Spinner animation='grow' />
  }

  if (!results) {
    return <p class='noSearchResults'>{t('noSearchResults')}</p>
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
