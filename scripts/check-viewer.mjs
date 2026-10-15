import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = await readFile(join(root, 'viewer', 'index.html'), 'utf8');
const dataMatch = html.match(/<script id="token-data" type="application\/json">([^<]+)<\/script>/);
const appMatch = html.match(/<script>\s*(\(\(\) => \{[\s\S]*?\}\)\(\);)\s*<\/script>/);
if (!dataMatch || !appMatch) throw new Error('Viewer data or script is missing');
new Script(appMatch[1], { filename: 'viewer/index.html' });
const files = JSON.parse(dataMatch[1]);
const manifest = files['manifest.json'];
const flatten = group => Object.values(group).flatMap(value =>
  value && Object.hasOwn(value, '$value') ? [value] : flatten(value));
const counts = {
  Typography: flatten(files['typography.json']).length,
  Dimensions: flatten(files['dimensions.json']).length,
  Radius: flatten(files['radius.json']).length,
  'Semantic Color': flatten(files['semantic-color.indonesia.json']).length
};
for (const [name, count] of Object.entries(counts)) {
  if (count !== manifest.collectionCounts[name]) throw new Error(`Wrong viewer count for ${name}`);
}
if (Object.values(counts).reduce((a, b) => a + b, 0) !== manifest.variableCount) {
  throw new Error('Wrong total viewer variable count');
}
if (Object.keys(files['text-styles.json'].styles).length !== manifest.textStyleCount) {
  throw new Error('Wrong viewer text style count');
}
const indonesia = flatten(files['semantic-color.indonesia.json']);
const kenya = flatten(files['semantic-color.kenya.json']);
if (indonesia.length !== kenya.length || !kenya.every(token => token.$type === 'color')) {
  throw new Error('Semantic modes do not align');
}
if (![...indonesia, ...kenya].every(token =>
  token.$value.alpha >= 0 && token.$value.alpha <= 1 && token.$value.components.length === 3)) {
  throw new Error('Invalid viewer color values');
}
console.log(`Viewer checked: ${manifest.variableCount} variables, ${manifest.textStyleCount} text styles, 2 color modes.`);
