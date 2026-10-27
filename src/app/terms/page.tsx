import { loadTerms } from '@/lib/data'
import TermsClient from './TermsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Index of Terms',
}

export default async function TermsPage() {
  const terms = await loadTerms()

  return <TermsClient terms={terms} />
}
