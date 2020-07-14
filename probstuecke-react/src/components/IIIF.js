import React, { createContext } from 'react'
import path from 'path'

const { Provider, Consumer: IIIFConsumer } = createContext();

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
          let xywhMatch = canvasUri.match(/#xywh=((\d)+,(\d)+,(\d)+,(\d)+)/)
          if (xywhMatch) {
            xywhParam = xywhMatch[1];
          }

          // extract the identifier from the annotation
          let idMatch = canvasUri.match(/\/(bsb(\d)+)\//);
          if (!idMatch) return acc
          let identifier = idMatch[1];

          // extract scan number
          let scanMatch = canvasUri.match(/canvas\/((\d)+)/);
          if (!scanMatch) return acc
          let scan = scanMatch[1].padStart(5, "0")

          // create an Image API URI from the given information
          // and from the user's choice.
          let imageApiUri = [
            'https://api.digitale-sammlungen.de/iiif/image/v2',
            (identifier + '_' + scan),
            xywhParam,
            'pct:50',
            '0',
            'color.jpg'].join('/')

          acc[path.basename(current['@id'])] = imageApiUri
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
      <Provider value={this.state}>{this.props.children}</Provider>
    )
  }
}

export {
  IIIFProvider,
  IIIFConsumer
}
