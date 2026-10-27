/**
 * Copies the TEI and MEI files from the probstuecke-data submodule to
 * public/data/, so that every page can offer its source files for download
 * and the static export serves them under /data/.
 *
 * Runs before `next build` and `next dev`.
 */

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'probstuecke-data/encodings')
const TARGET_DIR = path.join(process.cwd(), 'public/data')

function copyXmlFiles(dir) {
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      count += copyXmlFiles(full)
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      const target = path.join(TARGET_DIR, path.relative(DATA_DIR, full))
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.copyFileSync(full, target)
      count++
    }
  }
  return count
}

fs.rmSync(TARGET_DIR, { recursive: true, force: true })
console.log(`Copied ${copyXmlFiles(DATA_DIR)} XML files to ${path.relative(process.cwd(), TARGET_DIR)}/`)
