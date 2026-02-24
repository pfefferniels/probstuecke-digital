import { loadBibliography, loadExpressionIndexRefs } from '@/lib/data'
import BibliographyClient from './BibliographyClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bibliography',
}

export default async function BibliographyPage() {
  const bibliography = await loadBibliography()
  const expressions = await loadExpressionIndexRefs()

  return <BibliographyClient bibliography={bibliography} expressions={expressions} />
}
