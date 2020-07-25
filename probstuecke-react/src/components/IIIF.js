import React, { createContext } from 'react'

const IIIF = createContext()

class IIIFProvider extends React.Component {
  state = {
    data: null,
    ready: false,
    error: null
  }

  componentDidMount() {
    fetch(`data/${this.props.iiif}`)
      .then(response => response.json())
      .then(data => {
        var processed = {}
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

        this.setState({
          data: processed,
          ready: true
        })
      })
      .catch(error => {
        console.log(error)
        this.setState({
          error, ready: false
        })
      })
  }

  render () {
    return (
      <IIIF.Provider value={this.state}>{this.props.children}</IIIF.Provider>
    )
  }
}

export {
  IIIF,
  IIIFProvider
}
