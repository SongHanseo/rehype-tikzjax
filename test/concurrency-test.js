import fs from 'node:fs/promises';
import { rehype } from 'rehype';
import rehypeTikzjax from '../dist/index.js';

const PARALLEL_COUNT = 5;

async function processFile(taskId) {
  console.log(`#${taskId} started`);

  const document = await fs.readFile('./test/input.html', 'utf8');

  const file = await rehype()
    .data('settings', { fragment: true })
    .use(rehypeTikzjax, { showConsole: true, embedFontCss: true })
    .process(document);

  await fs.writeFile(`./test/output_${taskId}.html`, String(file));
  
  console.log(`#${taskId} success`);
}

async function runTest() {
  console.log(`start testing: ${PARALLEL_COUNT}`);
  const startTime = Date.now();

  const tasks = [];
  
  for (let i = 1; i <= PARALLEL_COUNT; i++) {
    tasks.push(processFile(i));
  }

  try {
    await Promise.all(tasks);
    
    const endTime = Date.now();
    console.log(`\ntest passed (${endTime - startTime}ms)`);
  } catch (error) {
    console.error(`\ntest failed\n`, error);
  }
}

runTest();