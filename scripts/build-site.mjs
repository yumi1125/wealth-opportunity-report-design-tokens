import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('../dist/', import.meta.url);

await mkdir(output, { recursive: true });
await copyFile(new URL('viewer/index.html', root), join(fileURLToPath(output), 'index.html'));
console.log('Built dist/index.html from the checked token viewer.');
