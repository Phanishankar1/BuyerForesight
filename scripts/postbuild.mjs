import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const distIndexPath = resolve('dist', 'index.html')
const dist404Path = resolve('dist', '404.html')
const noJekyllPath = resolve('dist', '.nojekyll')

if (existsSync(distIndexPath)) {
  copyFileSync(distIndexPath, dist404Path)
  writeFileSync(noJekyllPath, '')
}
