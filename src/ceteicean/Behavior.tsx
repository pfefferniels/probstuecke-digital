import type { ReactNode } from 'react'

export const Behavior = ({ children }: { node: unknown; children?: ReactNode }) => {
  return <>{children}</>
}
