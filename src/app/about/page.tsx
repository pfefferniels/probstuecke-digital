import { loadAbout } from '@/lib/data'
import { loadEditionVersion } from '@/lib/editionVersion'
import AboutClient from './AboutClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About the Edition',
}

export default async function AboutPage() {
  const about = await loadAbout()

  return <AboutClient transformed={about.transformed} version={loadEditionVersion()} />
}
