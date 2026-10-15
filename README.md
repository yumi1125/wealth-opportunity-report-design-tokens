# Wealth Opportunity Report · Design Tokens

本仓库交付移动端设计变量。**Figma 是设计值的维护入口；GitHub `main` 分支上的 JSON 是开发接入的已审核版本。** 当前先交付平台无关的 JSON，不生成 Flutter、iOS、Android 或 React Native 代码。

## 当前交付

| 文件 | 内容 |
| --- | --- |
| `tokens/typography.json` | 字体、字号、字重变量 |
| `tokens/dimensions.json` | 间距、描边宽度变量 |
| `tokens/radius.json` | 圆角变量 |
| `tokens/semantic-color.indonesia.json` | Indonesia 语义颜色 |
| `tokens/semantic-color.kenya.json` | Kenya 语义颜色 |
| `tokens/text-styles.json` | 四个文本样式及其变量绑定 |
| `tokens/manifest.json` | 数量及交付文件清单 |

`source/figma-snapshot.json` 是从 [Figma 设计系统](https://www.figma.com/design/946GZfDFpPwburJkuZy9mA) 读取的原始快照，供复核和重新生成。每个 token 的 `$extensions.figma` 保留 Figma ID 和原名；别名还保留目标 ID/名称，同时给开发提供已解析的颜色值。导出不会改动 Figma 变量。

## 每次更新

1. 设计师在 Figma 修改变量与文本样式，检查 Indonesia、Kenya 代表页面。
2. 在 Figma 桌面版导入 `figma-export/manifest.json` 作为开发插件；打开指定设计系统文件，运行 **Mobile tokens snapshot export**，下载 `figma-snapshot.json` 并替换 `source/figma-snapshot.json`。首次导入路径：插件 → 开发 → 从清单导入插件。普通开发插件读不到文件 key，插件以现有 Typography 集合 ID 校验文件，避免在其他文件误导出。插件只读，不上传数据。
3. 运行 `npm run build:tokens` 和 `npm run check:tokens`。需要 Node.js 20 或更新版本，无需安装依赖。
4. 按 [变量交付规则](docs/token-rules.md) 检查变化，在 [变更记录](CHANGELOG.md) 写明新增、修改、删除和受影响页面/组件。
5. 提交 GitHub Pull Request；开发检查 JSON 差异、两国模式及别名。合并后接入 App。后续迭代重复此流程。

若导出出现新集合、新模式或新文本样式，生成器会报错；先确认交付规则，再更新映射，避免静默漏导。若 Figma 字体不可用，保留实际字体名称并在开发接入前明确替代方案，不在导出时悄悄替换。

## 开发接入与验收

- 按 `tokens/manifest.json` 核对数量：当前 51 个变量、4 个文本样式；Indonesia / Kenya 的语义颜色各 25 个。
- 按目标市场选择一份 `semantic-color.*.json`，其他三类变量共用。颜色 `$value` 中 `components` 是 0–1 sRGB，`alpha` 单列；不要只取 `hex` 而丢失透明度。
- `$extensions.figma.alias` 表示原始 Figma 别名关系；当前已解析值可直接使用，别名元数据用于追踪与复核。
- 文本样式在 `text-styles.json` 单列；查看 `variableBindings`，不要只凭字号推断字重。当前 Figma 文本样式使用 PingFang SC，尚未确认移动端实际字体可用性。
- 首次接入时选 Indonesia 和 Kenya 各一张代表页面，对照 Figma 检查颜色、圆角、间距、文本样式。Figma Dev Mode 可查看节点的变量绑定和模式值。

此仓库只保存设计交付版本。确定移动端技术栈且手动交付成为负担后，再评估平台代码生成或自动发布。
