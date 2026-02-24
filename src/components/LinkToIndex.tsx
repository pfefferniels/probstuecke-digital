import Link from 'next/link'
import type { ReactNode } from 'react'

interface LinkToIndexProps {
  type: string
  teiNode: Element
  children?: ReactNode
}

const LinkToIndex = (props: LinkToIndexProps) => {
  const corresp = props.teiNode.getAttribute('corresp')

  if (!corresp) {
    return <span className='targetlessLink'>{props.children}</span>
  }

  return (
    <Link href={`/${props.type}#${corresp.replace('#', '')}`}>
      <span id={props.teiNode.getAttribute('id') || 'unknown'}>{props.children}</span>
    </Link>
  )
}

export default LinkToIndex
