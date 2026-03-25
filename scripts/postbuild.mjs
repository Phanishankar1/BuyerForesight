import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const distIndexPath = resolve('dist', 'index.html')
const dist404Path = resolve('dist', '404.html')

if (existsSync(distIndexPath)) {
  copyFileSync(distIndexPath, dist404Path)
}
