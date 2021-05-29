import React, { createContext, useState, useEffect } from 'react'
import { apiUrl } from '../config.js'
const IIIF = createContext()

const IIIFProvider = props => {
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchIIIF = async () => {
      try {
        const response = await fetch(`${apiUrl}/iiif/${props.iiif}`)
        const data = await response.json()
        console.log(data)

        let processed = {}
        processed = data.resources.reduce((acc, current) => {
          const canvasUri = current.on

          // extract the X, Y, width and height from the annotation
          // if no region is given, we are dealing with full page annotation on a <pb>
          let xywhParam = 'full'
          const xywhMatch = canvasUri.match(/#xywh=((\d)+,(\d)+,(\d)+,(\d)+)/)
          if (xywhMatch) {
            xywhParam = xywhMatch[1]
          }

          // extract the identifier from the annotation
          const idMatch = canvasUri.match(/\/(bsb(\d)+)\//)
          if (!idMatch) return acc
          const identifier = idMatch[1]

          // extract scan number
          const scanMatch = canvasUri.match(/canvas\/((\d)+)/);
          if (!scanMatch) return acc
          const scan = scanMatch[1].padStart(5, "0")

          // create an Image API URI from the given information
          // and from the user's choice.
          const imageApiUri = [
            'https://api.digitale-sammlungen.de/iiif/image/v2',
            (identifier + '_' + scan),
            xywhParam,
            'pct:50',
            '0',
            'color.jpg'].join('/')

          // extract ID of the corresponding element in the TEI/MEI file
          const elementId = current.resource['@id'].split('#').pop()

          if (!acc[elementId]) acc[elementId] = [ imageApiUri ]
          else acc[elementId].push(imageApiUri)

          return acc
        }, {})

        setData(processed)
        setReady(true)
      } catch (e) {
        console.log('Error:', e)
        setReady(false)
        setError(true)
      }
    }

    fetchIIIF()
  }, [])

  return (
    <IIIF.Provider value={{data, ready, error}}>{props.children}</IIIF.Provider>
  )
}

export {
  IIIF,
  IIIFProvider
}
