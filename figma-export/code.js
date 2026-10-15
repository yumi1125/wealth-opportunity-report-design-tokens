// Read-only Figma development plugin. The file key is fixed because ordinary
// development plugins cannot access figma.fileKey.
const SOURCE_FILE_KEY = '946GZfDFpPwburJkuZy9mA';
const EXPECTED_COLLECTION_ID = 'VariableCollectionId:28:10966';

figma.showUI(__html__, { width: 420, height: 240 });

async function exportSnapshot() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  if (!collections.some(collection => collection.id === EXPECTED_COLLECTION_ID)) {
    throw new Error('当前 Figma 文件不是预期的设计系统文件；请在指定文件中运行。');
  }
  const variables = await figma.variables.getLocalVariablesAsync();
  const styles = await figma.getLocalTextStylesAsync();
  const externalAliases = {};
  const pending = [];
  for (const variable of variables) {
    for (const value of Object.values(variable.valuesByMode)) {
      if (value && value.type === 'VARIABLE_ALIAS') pending.push(value.id);
    }
  }
  const localIds = new Set(variables.map(variable => variable.id));
  while (pending.length) {
    const id = pending.pop();
    if (localIds.has(id) || externalAliases[id]) continue;
    const variable = await figma.variables.getVariableByIdAsync(id);
    if (!variable) throw new Error(`无法解析别名变量 ${id}`);
    externalAliases[id] = {
      id: variable.id, name: variable.name, collectionId: variable.variableCollectionId,
      type: variable.resolvedType, valuesByMode: variable.valuesByMode
    };
    for (const value of Object.values(variable.valuesByMode)) {
      if (value && value.type === 'VARIABLE_ALIAS') pending.push(value.id);
    }
  }
  return {
    fileKey: SOURCE_FILE_KEY,
    collections: collections.map(collection => ({
      id: collection.id, name: collection.name, modes: collection.modes,
      defaultModeId: collection.defaultModeId, variableIds: collection.variableIds
    })),
    variables: variables.map(variable => ({
      id: variable.id, name: variable.name, type: variable.resolvedType,
      collectionId: variable.variableCollectionId, valuesByMode: variable.valuesByMode,
      description: variable.description, scopes: variable.scopes, codeSyntax: variable.codeSyntax
    })),
    styles: styles.map(style => ({
      id: style.id, name: style.name, fontName: style.fontName, fontSize: style.fontSize,
      lineHeight: style.lineHeight, letterSpacing: style.letterSpacing,
      textCase: style.textCase, textDecoration: style.textDecoration,
      boundVariables: style.boundVariables
    })),
    externalAliases
  };
}

figma.ui.onmessage = async message => {
  if (message.type !== 'export') return;
  try {
    figma.ui.postMessage({ type: 'progress', message: '正在读取变量和文本样式…' });
    const snapshot = await exportSnapshot();
    figma.ui.postMessage({ type: 'result', snapshot });
  } catch (error) {
    figma.ui.postMessage({ type: 'error', message: String(error?.message ?? error) });
  }
};
