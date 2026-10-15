import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const snapshotPath = join(root, 'source', 'figma-snapshot.json');
const outputDir = join(root, 'tokens');
const viewerTemplatePath = join(root, 'viewer', 'template.html');
const viewerPath = join(root, 'viewer', 'index.html');
const modeNames = new Map([['印尼', 'indonesia'], ['Indonesia', 'indonesia'], ['肯尼亚', 'kenya'], ['Kenya', 'kenya']]);
const styleNames = new Map([['一级标题', 'heading1'], ['二级标题', 'heading2'], ['正文', 'body'], ['辅助文字', 'caption']]);
const fontWeights = new Map([['Regular', 400], ['Medium', 500], ['Semibold', 600], ['SemiBold', 600], ['Semi Bold', 600]]);
const fileNames = new Map([
  ['Typography', 'typography.json'],
  ['Dimensions', 'dimensions.json'],
  ['Radius', 'radius.json'],
  ['Semantic Color:indonesia', 'semantic-color.indonesia.json'],
  ['Semantic Color:kenya', 'semantic-color.kenya.json']
]);

function fail(message) { throw new Error(message); }
function slug(value) {
  const result = value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  if (!result) fail(`Invalid token path segment: ${value}`);
  return result;
}
function nestedSet(rootObject, path, token, label) {
  let current = rootObject;
  for (const part of path.slice(0, -1)) {
    if (current[part]?.$value !== undefined) fail(`Token/group collision: ${label}`);
    current = current[part] ??= {};
  }
  const leaf = path.at(-1);
  if (current[leaf] !== undefined) fail(`Duplicate token path: ${label}`);
  current[leaf] = token;
}
function colorValue(value) {
  if (!value || !['r', 'g', 'b'].every(k => typeof value[k] === 'number')) fail('Invalid Figma color value');
  const byte = n => Math.round(n * 255).toString(16).padStart(2, '0');
  const round = n => Math.round(n * 1_000_000) / 1_000_000;
  return { colorSpace: 'srgb', components: [round(value.r), round(value.g), round(value.b)],
    alpha: round(value.a ?? 1), hex: `#${byte(value.r)}${byte(value.g)}${byte(value.b)}`.toUpperCase() };
}
function resolveValue(value, snapshot, chain = []) {
  if (value?.type !== 'VARIABLE_ALIAS') return { value, alias: null };
  if (chain.includes(value.id)) fail(`Circular alias: ${[...chain, value.id].join(' -> ')}`);
  const target = snapshot.externalAliases?.[value.id] ?? snapshot.variables.find(v => v.id === value.id);
  if (!target) fail(`Unresolved Figma alias: ${value.id}`);
  const values = Object.values(target.valuesByMode);
  if (values.length !== 1 && !values.every(v => JSON.stringify(v) === JSON.stringify(values[0]))) {
    fail(`Alias ${target.name} has multiple different modes; add an explicit mode mapping`);
  }
  const resolved = resolveValue(values[0], snapshot, [...chain, value.id]);
  return { value: resolved.value, alias: { variableId: value.id, name: target.name,
    collectionId: target.collectionId, via: resolved.alias ?? undefined } };
}
function tokenFor(variable, modeId, snapshot) {
  const raw = variable.valuesByMode[modeId];
  if (raw === undefined) fail(`Missing mode value: ${variable.name} / ${modeId}`);
  const { value, alias } = resolveValue(raw, snapshot);
  const ext = { variableId: variable.id, name: variable.name, ...(alias && { alias }) };
  let type, tokenValue;
  if (variable.type === 'COLOR') { type = 'color'; tokenValue = colorValue(value); }
  else if (variable.type === 'FLOAT') { type = 'dimension'; tokenValue = { value, unit: 'px' }; }
  else if (variable.type === 'STRING' && variable.name.startsWith('Family/')) {
    type = 'fontFamily'; tokenValue = value;
  } else if (variable.type === 'STRING' && variable.name.startsWith('Weight/')) {
    type = 'fontWeight'; tokenValue = fontWeights.get(value);
    if (!tokenValue) fail(`Unknown font weight: ${variable.name} = ${value}`);
    ext.figmaValue = value;
  } else fail(`Unsupported variable: ${variable.name} (${variable.type})`);
  return { $type: type, $value: tokenValue, $extensions: { figma: ext } };
}
function collectionOutput(collection, variables, mode, snapshot) {
  const output = {};
  const modeId = mode.modeId;
  for (const variable of variables) {
    const path = variable.name.split('/').map(slug);
    nestedSet(output, path, tokenFor(variable, modeId, snapshot), variable.name);
  }
  return output;
}
function textStylesOutput(snapshot, variables) {
  const byId = new Map(variables.map(v => [v.id, v]));
  const styles = {};
  for (const style of snapshot.styles) {
    const key = styleNames.get(style.name);
    if (!key) fail(`Unmapped text style: ${style.name}`);
    if (styles[key]) fail(`Duplicate text style: ${key}`);
    const bindings = {};
    for (const [field, alias] of Object.entries(style.boundVariables ?? {})) {
      const target = byId.get(alias?.id);
      if (!target) fail(`Text style ${style.name} references missing variable ${alias?.id}`);
      bindings[field] = { collection: snapshot.collections.find(c => c.id === target.collectionId)?.name, name: target.name };
    }
    styles[key] = { figmaName: style.name, fontFamily: style.fontName.family, fontStyle: style.fontName.style,
      fontSize: { value: style.fontSize, unit: 'px' }, lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing, textCase: style.textCase, textDecoration: style.textDecoration,
      variableBindings: bindings };
  }
  return { sourceFileKey: snapshot.fileKey, styles };
}
function build(snapshot) {
  if (!snapshot?.fileKey || !Array.isArray(snapshot.collections) || !Array.isArray(snapshot.variables) || !Array.isArray(snapshot.styles)) fail('Invalid Figma snapshot');
  const files = new Map();
  const listed = new Set();
  for (const collection of snapshot.collections) {
    const members = snapshot.variables.filter(v => v.collectionId === collection.id);
    if (members.length !== collection.variableIds.length) fail(`Collection count mismatch: ${collection.name}`);
    for (const variable of members) listed.add(variable.id);
    for (const mode of collection.modes) {
      const modeKey = modeNames.get(mode.name);
      if (!modeKey) fail(`Unknown mode: ${collection.name} / ${mode.name}`);
      const filename = fileNames.get(collection.name === 'Semantic Color' ? `${collection.name}:${modeKey}` : collection.name);
      if (!filename) fail(`Unexpected collection: ${collection.name}`);
      if (files.has(filename)) fail(`Multiple modes would overwrite ${filename}`);
      files.set(filename, collectionOutput(collection, members, mode, snapshot));
    }
  }
  if (listed.size !== snapshot.variables.length) fail('Some variables are not in a collection');
  if (files.size !== 5) fail(`Expected five token files; found ${files.size}`);
  files.set('text-styles.json', textStylesOutput(snapshot, snapshot.variables));
  files.set('manifest.json', { source: `https://www.figma.com/design/${snapshot.fileKey}`, variableCount: snapshot.variables.length,
    collectionCounts: Object.fromEntries(snapshot.collections.map(c => [c.name, c.variableIds.length])),
    semanticColorModes: ['indonesia', 'kenya'], textStyleCount: snapshot.styles.length,
    files: [...files.keys()] });
  return files;
}

function viewerContent(template, files) {
  const data = Object.fromEntries(files);
  // The JSON lives inside an inert script tag so the viewer opens via file://.
  const encoded = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const marker = '<!-- EMBEDDED_TOKEN_DATA -->';
  if (!template.includes(marker)) fail('Viewer template data marker is missing');
  return template.replace(marker, `<script id="token-data" type="application/json">${encoded}</script>`);
}

const flag = process.argv[2];
if (!['--write', '--check'].includes(flag)) fail('Use --write or --check');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const files = build(snapshot);
if (flag === '--write') await mkdir(outputDir, { recursive: true });
for (const [name, data] of files) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const path = join(outputDir, name);
  if (flag === '--write') await writeFile(path, content);
  else {
    let current;
    try { current = await readFile(path, 'utf8'); } catch { fail(`Missing generated file: ${name}`); }
    if (current !== content) fail(`Outdated generated file: ${name}. Run npm run build:tokens`);
  }
}
const template = await readFile(viewerTemplatePath, 'utf8');
const html = viewerContent(template, files);
if (flag === '--write') await writeFile(viewerPath, html);
else {
  let current;
  try { current = await readFile(viewerPath, 'utf8'); } catch { fail('Missing generated viewer/index.html'); }
  if (current !== html) fail('Outdated viewer/index.html. Run npm run build:tokens');
}
process.stdout.write(`${flag === '--write' ? 'Wrote' : 'Checked'} ${files.size} token files and viewer/index.html, ${snapshot.variables.length} variables, ${snapshot.styles.length} text styles.\n`);
