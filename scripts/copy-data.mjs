/**
 * Copies the TEI and MEI files and the audio recordings from the
 * probstuecke-data submodule to public/data/, so that every page can offer
 * its source files for download and play its recordings, and the static
 * export serves them under /data/.
 *
 * Runs before `next build` and `next dev`.
 */

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'probstuecke-data/encodings')
const TARGET_DIR = path.join(process.cwd(), 'public/data')

// the encodings and the recordings that the realisations and lessons point to
const EXTENSIONS = new Set(['.xml', '.ogg', '.oga', '.opus', '.mp3', '.m4a', '.wav', '.flac'])

function copyDataFiles(dir) {
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      count += copyDataFiles(full)
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const target = path.join(TARGET_DIR, path.relative(DATA_DIR, full))
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.copyFileSync(full, target)
      count++
    }
  }
  return count
}

fs.rmSync(TARGET_DIR, { recursive: true, force: true })
console.log(`Copied ${copyDataFiles(DATA_DIR)} XML and audio files to ${path.relative(process.cwd(), TARGET_DIR)}/`)
