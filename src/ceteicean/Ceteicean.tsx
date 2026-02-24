'use client'

import { useEffect, useMemo, useState } from 'react'
import { TEIRender, TEIRoute } from 'react-teirouter'
import define from './define'
import {
  Tei,
  Eg,
  Graphic,
  List,
  Note,
  Ptr,
  Ref,
  TeiHeader,
} from './DefaultBehaviors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Routes = Record<string, any>

interface CeteiceanProps {
  pageContext: { prefixed: string; elements: string[] }
  routes?: Routes
}

export default function Ceteicean({ pageContext, routes }: CeteiceanProps) {
  const { prefixed, elements } = pageContext
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) define(elements)
  }, [mounted, elements])

  const doc = useMemo(() => {
    if (!mounted) return null
    return new DOMParser().parseFromString(prefixed, 'text/xml')
  }, [prefixed, mounted])

  if (!doc) return null

  const defaultRoutes: Routes = {
    "tei-tei": Tei,
    "tei-eg": Eg,
    "tei-graphic": Graphic,
    "tei-list": List,
    "tei-note": Note,
    "tei-ptr": Ptr,
    "tei-ref": Ref,
    "tei-teiheader": TeiHeader,
  }

  const _routes = routes ? routes : defaultRoutes

  const teiRoutes = Object.keys(_routes).map((el, i) => {
    return <TEIRoute el={el} component={_routes[el]} key={`tr-${i}`} />
  })

  return (
    <TEIRender data={doc.documentElement}>
      {teiRoutes}
    </TEIRender>
  )
}
