import type { ComponentType, ReactNode } from 'react'
import { TEINodes } from 'react-teirouter'

type TBehavior = ComponentType<{ teiNode: Node; children?: ReactNode; [key: string]: unknown }>

const DefaultBehavior: TBehavior = (props) => {
  return <TEINodes teiNodes={props.teiNode.childNodes} {...props} />
}

export const Tei: TBehavior = DefaultBehavior
export const Eg: TBehavior = DefaultBehavior
export const List: TBehavior = DefaultBehavior
export const Note: TBehavior = DefaultBehavior

export const Graphic: TBehavior = ({ teiNode }) => {
  const el = teiNode as Element
  const url = el.getAttribute('url') || ''
  // the <desc> of a graphic says what the image shows, for those who cannot see it
  const desc = Array.from(el.children).find(child => child.localName === 'tei-desc')
  return <img src={url} alt={desc?.textContent?.replace(/\s+/g, ' ').trim() ?? ''} />
}

export const Ptr: TBehavior = ({ teiNode, ...props }) => {
  const el = teiNode as Element
  const target = el.getAttribute('target') || ''
  return <a href={target}><TEINodes teiNodes={teiNode.childNodes} {...props} /></a>
}

export const Ref: TBehavior = ({ teiNode, ...props }) => {
  const el = teiNode as Element
  const target = el.getAttribute('target') || ''
  return <a href={target}><TEINodes teiNodes={teiNode.childNodes} {...props} /></a>
}

export const TeiHeader: TBehavior = () => null

