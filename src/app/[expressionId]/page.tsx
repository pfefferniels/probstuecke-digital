import { loadExpressionIds, loadExpression } from '@/lib/data'
import { loadEditionVersion } from '@/lib/editionVersion'
import { citationMetaTags, expressionTitle } from '@/lib/citation'
import PieceClient from './PieceClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ expressionId: string }>
}

export async function generateStaticParams() {
  return loadExpressionIds()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { expressionId } = await params
  const expression = await loadExpression(expressionId)
  if (!expression) return { title: expressionId }

  return {
    title: expressionTitle(expression),
    alternates: { canonical: `/${expressionId}/` },
    other: citationMetaTags(expression),
  }
}

export default async function ExpressionPage({ params }: PageProps) {
  const { expressionId } = await params
  const expression = await loadExpression(expressionId)

  if (!expression) {
    notFound()
  }

  return <PieceClient piece={expression} version={loadEditionVersion()} />
}
