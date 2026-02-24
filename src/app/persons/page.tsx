import { loadPersons, loadExpressionIndexRefs } from '@/lib/data'
import PersonsClient from './PersonsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Persons',
}

export default async function PersonsPage() {
  const persons = await loadPersons()
  const expressions = await loadExpressionIndexRefs()

  return <PersonsClient persons={persons} expressions={expressions} />
}
