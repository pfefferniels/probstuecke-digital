import { loadMusicalWorks, loadExpressionIndexRefs } from '@/lib/data'
import MusicalWorksClient from './MusicalWorksClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Musical Works',
}

export default async function MusicalWorksPage() {
  const musicalWorks = await loadMusicalWorks()
  const expressions = await loadExpressionIndexRefs()

  return <MusicalWorksClient musicalWorks={musicalWorks} expressions={expressions} />
}
