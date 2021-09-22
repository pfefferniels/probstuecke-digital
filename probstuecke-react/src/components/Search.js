import React, { useState, useEffect, useContext } from 'react'
import { Spinner } from 'react-bootstrap'
import { useParams, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAPIError from '../hooks/useAPIError'
import { apiUrl } from '../config'
import { TOC } from '../providers/TOC'
import './Search.scss'

const Search = () => {
  const [results, setResults] = useState([])
  const [ready, setReady] = useState(false)
  const { q } = useParams()
  const history = useHistory()
  const { t } = useTranslation()
  const { addError } = useAPIError()
  const toc = useContext(TOC)

  const findInToc = (path) => {
    for (const [n, value] of Object.entries(toc.data)) {
      for (const [key, edition] of Object.entries(value.editions)) {
        if (edition.comments === path) {
          return {n, key}
        }
      }
    }
  }

  const redirectTo = (path) => {
    const where = findInToc(path)
    history.push(`/n${where.n}/${where.key}`)
  }

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await fetch(`${apiUrl}/search/${q}`)
        const json = await data.json()

        // nothing found
        if (!json.results) {
          setResults([])
          setReady(true)
          return
        }

        setResults(
          Array.isArray(json.results) ?
            json.results : // multiple results
            [json.results] // exactly one result
        )
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

  if (results.length === 0) {
    return <p className='noSearchResults'>{t('noSearchResults')}</p>
  }

  return (
    <div id='searchResults'>
      {results.map((result, i) => {
        return (
          <div key={`result${i}`}
               className='result'
               onClick={() => redirectTo(result.path)}>
            <b className='title'>{result.title}</b>
            <p className='summary' dangerouslySetInnerHTML={{__html: result.summary}} />
          </div>
        )
      })}
    </div>
  )
}

export default Search
