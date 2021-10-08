(: build variable for file:)
let $file.context := 'http://iiif.io/api/presentation/2/context.json'
let $file.type := 'sc:Manifest'
let $id := $document.uri || 'manifest.json'
let $label := '?'
let $description := normalize-space(string-join($file//mei:fileDesc/mei:titleStmt/mei:composer//text(),' ')) || ': ' ||  string-join($file//mei:fileDesc/mei:titleStmt/mei:title//normalize-space(text()),' / ')
let $license := 'http://rightsstatements.org/vocab/CNE/1.0/' (: TODO: this should be made more specific, if possible :)
let $attribution := 'Probstücke Digital'
let $viewingDirection := 'left-to-right'
let $viewingHint := 'paged'

(: decls can be #firstEdition or #secondEdition :)
let $facsimiles := $file//mei:facsimile

(: build variable for sequences :)
let $sequences :=
  for $facsimile in $relevantFacsimiles
  let $sequence.type := 'sc:Sequence'
  let $sequence.id := $document.uri || 'seq1'
  let $sequence.viewingDir := 'left-to-right'

  (: build variables for canvases = surfaces :)
  let $canvases :=
    for $canvas at $canvas.index in $facsimile/mei:surface (: iiif:canvas matches mei:surface :)
    let $canvas.id := $document.uri || 'canvas/' || (if($canvas/@xml:id) then($canvas/@xml:id) else($canvas.index))
    let $canvas.type := 'sc:Canvas'
    let $canvas.label :=
        if($canvas/@label)
        then($canvas/string(@label))
        else if($canvas/@n)
        then($canvas/string(@n))
        else(string($canvas.index))

    let $canvas.width := $canvas/mei:graphic[@width][1]/xs:integer(@width)
    let $canvas.height := $canvas/mei:graphic[@height][1]/xs:integer(@height)

    (: build variables for images = graphics :)
    let $images :=
      for $image in $canvas/mei:graphic
      let $image.type := 'oa:Annotation'
      let $image.motivation := 'sc:painting'
      let $image.width := $image/xs:integer(@width)
      let $image.height := $image/xs:integer(@height)
      let $image.resource := $image/string(@target)

      let $image.on := $canvas.id
      return map {
        '@type': $image.type,
        'motivation': $image.motivation,
        'resource': $image.resource,
        'on': $image.on
      }

    let $otherContent :=
        let $zoneContent :=
            if($canvas/mei:zone)
            then(
                map {
                  '@id': $document.uri || 'list/' || (if($canvas/@xml:id) then($canvas/@xml:id) else($canvas.index)) || '_zones',
                  '@type': 'sc:AnnotationList',
                  'within': map {
                    '@id': $document.uri || 'layer/measureZones',
                    '@type': 'sc:Layer',
                    'label': 'measure positions'
                  }
                }
            )
            else()

        return array { $zoneContent }

    let $canvas.map :=
        map {
            '@id': $canvas.id,
            '@type': $canvas.type,
            'label': $canvas.label,
            'images': array { $images },
            'width': $canvas.width,
            'height': $canvas.height,
            'otherContent': $otherContent
        }

    return $canvas.map

  return map {
    '@id': $sequence.id,
    '@type': $sequence.type,
    'viewingDirection': $sequence.viewingDir,
    'canvases': array { $canvases }
  }

return map {
  '@context': $file.context,
  '@type': $file.type,
  '@id': $id,
  'label': $label,
  'license': $license,
  'attribution': $attribution,
  'sequences': array { $sequences },
  'description': $description,
  'viewingDirection': $viewingDirection,
  'viewingHint': $viewingHint
}
