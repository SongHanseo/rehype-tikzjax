import fs from 'node:fs/promises'
import {rehype} from 'rehype'
import rehypeTikzjax from '../dist/index.js'

const document = await fs.readFile('./test/input.html', 'utf8')

const file = await rehype()
  .data('settings', {fragment: true})
  .use(rehypeTikzjax, {showConsole:true, embedFontCss:true})
  .process(document)

await fs.writeFile('./test/output.html', String(file))