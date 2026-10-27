import ImprintClient from './ImprintClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Imprint and Privacy',
}

export default function ImprintPage() {
  return <ImprintClient />
}
