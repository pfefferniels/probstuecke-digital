import { loadWorks } from '@/lib/data'
import IndexClient from './IndexClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
}

export default async function HomePage() {
  const works = await loadWorks()

  return <IndexClient works={works} />
}
