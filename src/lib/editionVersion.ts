import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import type { EditionVersion } from '@/lib/types'

const DATA_ROOT = path.join(process.cwd(), 'probstuecke-data')

let cachedVersion: EditionVersion | null = null

/**
 * Version of the data the site was built from: the release number in the data
 * repository's CITATION.cff, the commit of the probstuecke-data submodule and
 * the build date.
 */
export const loadEditionVersion = (): EditionVersion => {
  if (cachedVersion) return cachedVersion

  let version: string | null = null
  try {
    const cff = fs.readFileSync(path.join(DATA_ROOT, 'CITATION.cff'), 'utf-8')
    version = cff.match(/^version:\s*["']?([^"'\s]+)/m)?.[1] ?? null
  } catch {
    // no CITATION.cff in the data repository
  }

  let commit: string | null = null
  try {
    commit = execSync('git rev-parse --short HEAD', {
      cwd: DATA_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim() || null
  } catch {
    // data directory is not a git checkout
  }

  cachedVersion = {
    version,
    commit,
    buildDate: new Date().toISOString().slice(0, 10),
  }
  return cachedVersion
}
