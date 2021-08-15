import React, { useEffect, useState } from 'react'
import CETEI from 'CETEIcean'
import path from 'path'
import { apiUrl } from '../config'

const teiToHtml = async (file) => {
  const ct = new CETEI()
  ct.addBehaviors({
    'teiHeader': undefined
  })
  return ct.getHTML5(file)
}

const useTEI = (tei, addError) => {
  const [ teiData, setTeiData ] = useState(null)
  const teiPath = path.dirname(tei)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const data = await teiToHtml(`${apiUrl}/tei?path=${tei}`)
        setTeiData(data)
      } catch (e) {
        addError(`failed fetching TEI: ${e}`, 'warning')
      }
    }

    fetchTEI()
  }, [tei, addError])

  return {teiData, teiPath}
}

export default useTEI
