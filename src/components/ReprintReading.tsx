import type { ReactNode } from 'react'
import { Tooltip } from '@mui/material'

interface ReprintReadingProps {
  teiNode: Element
  children?: ReactNode
}

const part = (app: Element, name: string) => Array.from(app.children).find((child) => child.localName === name)

const textOf = (el: Element | undefined) => (el?.textContent || '').replace(/\s+/g, ' ').trim()

/**
 * A place where the later printing of 1731 reads otherwise (<app type="reprint">): the text
 * of the first printing (<lem>), which the edition follows, and a mark that shows the
 * reading of the later printing (<rdg>, which is not rendered in the text; see tei-rdg in
 * PieceClient). Beneath the lines of a translation only the text of the first printing is
 * shown.
 */
const ReprintReading = ({ teiNode, children }: ReprintReadingProps) => {
  if (teiNode.getAttribute('type') !== 'reprint' || teiNode.closest('tei-seg[type="original"]')) {
    return <>{children}</>
  }
  const lem = textOf(part(teiNode, 'tei-lem'))
  const rdg = textOf(part(teiNode, 'tei-rdg'))
  const title = !rdg
    ? 'Not in the later printing of 1731'
    : !lem
      ? <>Only in the later printing of 1731: <em>{rdg}</em></>
      : <>The later printing of 1731: <em>{rdg}</em></>

  return (
    <span className="reprintReading">
      {children}
      <Tooltip title={title} placement="top" describeChild>
        <sup className="reprintMark" tabIndex={0} aria-label={typeof title === 'string' ? title : `The later printing of 1731: ${rdg}`}>
          °
        </sup>
      </Tooltip>
    </span>
  )
}

export default ReprintReading
