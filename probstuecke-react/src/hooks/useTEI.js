import React, { useEffect, useState } from 'react'
import CETEI from 'CETEIcean'
import path from 'path'
import { apiUrl } from '../config'

const teiToHtml = async (file) => {
  const ct = new CETEI({
    ignoreFragmentId: true,
  })
  ct.addBehaviors({
    teiHeader: undefined,
  })
  return ct.getHTML5(file)
}

const useTEI = (tei, addError, modernize) => {
  const [teiData, setTeiData] = useState(null)
  const teiPath = path.dirname(tei)

  useEffect(() => {
    const fetchTEI = async () => {
      try {
        const data = await teiToHtml(
          `${apiUrl}/tei?path=${tei}&modernize=${modernize ? 1 : 0}`
        )
        setTeiData(data)
      } catch (e) {
        addError(`failed fetching TEI: ${e}`, 'warning')
      }
    }

    fetchTEI()
  }, [tei, modernize, addError])

  return { teiData, teiPath }
}

export default useTEI
