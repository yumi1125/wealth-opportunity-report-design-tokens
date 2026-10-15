import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = await readFile(join(root, 'viewer', 'index.html'), 'utf8');
const snapshot = JSON.parse(await readFile(join(root, 'source', 'figma-snapshot.json'), 'utf8'));
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
const fileFor = new Map([
  ['Typography', 'typography.json'], ['Dimensions', 'dimensions.json'],
  ['Radius', 'radius.json'], ['Semantic Color', 'semantic-color.indonesia.json']
]);
for (const collection of snapshot.collections) {
  const output = files[fileFor.get(collection.name)];
  const expectedPaths = collection.variableIds.map(id => {
    const variable = snapshot.variables.find(item => item.id === id);
    if (!variable) throw new Error(`Missing source variable ${id}`);
    const token = variable.name.split('/').reduce((group, segment) => group?.[segment], output);
    if (token?.$extensions?.figma?.variableId !== id || token.$extensions.figma.name !== variable.name) {
      throw new Error(`Viewer path differs from Figma: ${variable.name}`);
    }
    return variable.name;
  });
  const outputPaths = [];
  const visit = (group, parents = []) => {
    for (const [segment, value] of Object.entries(group)) {
      if (value && Object.hasOwn(value, '$value')) outputPaths.push([...parents, segment].join('/'));
      else visit(value, [...parents, segment]);
    }
  };
  visit(output);
  if (JSON.stringify(outputPaths.sort()) !== JSON.stringify(expectedPaths.sort())) {
    throw new Error(`Viewer names differ from Figma: ${collection.name}`);
  }
  if (collection.name === 'Semantic Color') {
    const kenya = files['semantic-color.kenya.json'];
    for (const id of collection.variableIds) {
      const variable = snapshot.variables.find(item => item.id === id);
      const token = variable.name.split('/').reduce((group, segment) => group?.[segment], kenya);
      if (token?.$extensions?.figma?.variableId !== id) {
        throw new Error(`Kenya viewer path differs from Figma: ${variable.name}`);
      }
    }
  }
}
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
