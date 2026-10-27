'use client'

import Link from 'next/link'
import Ceteicean from '@/ceteicean/Ceteicean'
import { longLabel } from '@/lib/expressionLabels'
import type { ExpressionContext, ParallelText as ParallelTextData } from '@/lib/types'

interface ParallelTextProps {
  parallel: ParallelTextData
  context: ExpressionContext | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routes: Record<string, any>
}

/**
 * A translation side by side with its original: each sentence of the original
 * in one row with the sentence or sentences of the translation that render it
 * (<seg type="pair">, see helpers/alignTranslation). On phones the original
 * stands above the translation.
 */
export const ParallelText = ({ parallel, context, routes }: ParallelTextProps) => {
  const original = context?.siblings.find((sibling) => sibling.referringTo.includes(parallel.originalId ?? ''))

  return (
    <div className="parallel">
      <div className="parallelHeader" aria-hidden="true">
        <span>
          {original
            ? <Link href={`/${original.referringTo[0]}/`}>{longLabel(original)}</Link>
            : 'Original'}
        </span>
        <span>{context ? longLabel(context.expression) : 'Translation'}</span>
      </div>
      <Ceteicean pageContext={parallel.text} routes={routes} />
    </div>
  )
}
