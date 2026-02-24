import { loadExpressions, loadExpression } from '@/lib/data'
import PieceClient from './PieceClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ expressionId: string }>
}

export async function generateStaticParams() {
  const expressions = await loadExpressions()
  return expressions
    .filter(e => e.expressionId)
    .map(e => ({
      expressionId: e.expressionId!,
    }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { expressionId } = await params
  const expression = await loadExpression(expressionId)
  return {
    title: expression?.label || expressionId,
  }
}

export default async function ExpressionPage({ params }: PageProps) {
  const { expressionId } = await params
  const expression = await loadExpression(expressionId)

  if (!expression) {
    notFound()
  }

  return <PieceClient piece={expression} />
}
