import { loadRegister } from '@/lib/data'
import RegisterClient from './RegisterClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mattheson’s Register (1731)',
}

export default async function RegisterPage() {
  const register = await loadRegister()

  return <RegisterClient register={register} />
}
