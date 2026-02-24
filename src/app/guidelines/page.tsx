import { loadGuidelines } from '@/lib/data'
import GuidelinesClient from './GuidelinesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guidelines',
}

export default async function GuidelinesPage() {
  const guideline = await loadGuidelines()

  return <GuidelinesClient transformed={guideline.transformed} />
}
