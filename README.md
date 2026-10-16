# Wealth Opportunity Report · Design Tokens

## 快速入口

- **在线浏览变量**：[打开受登录保护的变量浏览页](https://wealth-opportunity-report-design-to-xi.vercel.app/)。使用已获此 Vercel 项目访问权限的账号登录后，可直接在浏览器中查看；无需下载 HTML。若尚无权限，请联系项目管理员添加为 Vercel 项目成员。
- **开发下载**：[下载当前正式版 ZIP](https://github.com/yumi1125/wealth-opportunity-report-design-tokens/archive/refs/heads/main.zip) · [查看 `tokens/` JSON](https://github.com/yumi1125/wealth-opportunity-report-design-tokens/tree/main/tokens) · [复制仓库地址](https://github.com/yumi1125/wealth-opportunity-report-design-tokens)。ZIP 包含变量 JSON、文本样式、浏览页及导出工具；接入 App 请使用 `tokens/` 下的 JSON。

本仓库交付移动端设计变量。**Figma 是设计值的唯一编辑入口；GitHub `main` 分支上的 JSON 是开发接入的已审核版本。** 当前先交付平台无关的 JSON，不生成 Flutter、iOS、Android 或 React Native 代码。仓库为私有，需先获得仓库访问权限。

## 变量库依据与组织规则

这份交付从[现有 Figma 设计系统文件](https://www.figma.com/design/946GZfDFpPwburJkuZy9mA)的**本地变量和文本样式**读取，不依据截图重新造一套值。按 Figma 的**集合 → 分组 → 变量名**组织：`Typography`（字体排印）、`Dimensions`（大小）、`Radius`（圆角）、`Semantic Color`（语义颜色）。例如 Figma 的 `Text/Primary` 在 JSON 中保持为 `Text → Primary`，在浏览页中选择 `Text` 分组后显示变量名 `Primary`。不会另起一套 kebab-case 命名。`$extensions.figma` 还保留变量 ID、原名与别名来源，便于回查。

颜色按 Figma 的 Indonesia、Kenya 两个模式分别交付，同一个语义变量在两国可有不同值；其他三类当前共用一套。文本样式单独交付，避免只看字号而漏掉字重及绑定关系。当前仓库记录的是**导出当时的变量库快照**，并未在本次导出中重新审计每个变量是否仍被页面或组件绑定。新增、改名或删除前，应回到 Figma 检查实际使用情况。更细的命名及变更约定见[变量交付规则](docs/token-rules.md)。

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
| `viewer/index.html` | 可离线打开的只读变量浏览界面；同一内容也部署为上述在线浏览页 |

`source/figma-snapshot.json` 是从 [Figma 设计系统](https://www.figma.com/design/946GZfDFpPwburJkuZy9mA) 读取的原始快照，供复核和重新生成。每个 token 的 `$extensions.figma` 保留 Figma ID 和原名；别名还保留目标 ID/名称，同时给开发提供已解析的颜色值。导出不会改动 Figma 变量。

## 下载与查看

1. **在线查看**：打开上方的[变量浏览页](https://wealth-opportunity-report-design-to-xi.vercel.app/)，登录已获此 Vercel 项目访问权限的账号。Vercel Authentication 对生产和预览部署均要求登录；GitHub 仓库权限与 Vercel 项目权限需分别授予。
2. **下载整个交付包**：先取得[私有仓库](https://github.com/yumi1125/wealth-opportunity-report-design-tokens)访问权限。点击上方“下载当前正式版 ZIP”，或在仓库 `main` 分支点击绿色 **Code → Download ZIP**。解压后双击 `viewer/index.html` 也可离线查看；页面已内嵌变量数据，无需启动服务器。
3. **用 Git 更新**：运行 `git clone https://github.com/yumi1125/wealth-opportunity-report-design-tokens.git`，以后在本地仓库运行 `git pull`。克隆后打开 `viewer/index.html`；需要原始数据时读取 `tokens/` 下的 JSON。
4. **只下载某份 JSON**：在 GitHub 仓库打开 `tokens/` 中目标文件，点击 **Download raw file**（下载原始文件）。若 GitHub 界面只显示 **Raw**，打开后使用浏览器“另存为”，并保留 `.json` 扩展名。

浏览界面按 Figma 集合与分组展示变量，搜索原始路径或别名；语义颜色可并排对比 Indonesia / Kenya，也可只看其中一国；还能查看透明度、尺寸、圆角、文本样式与别名来源。**它只用于查看和核对，不能编辑或同步回 Figma。** 设计师维护变量时仍在 Figma 操作，开发通过 GitHub PR 审核交付值。

## 每次更新

1. 设计师在 Figma 修改变量与文本样式，检查 Indonesia、Kenya 代表页面。
2. 首次使用时，在 Figma 桌面版选择 **插件 → 开发 → 从清单导入插件**，选取仓库里的 `figma-export/manifest.json`。打开指定设计系统文件，运行 **Mobile tokens snapshot export**，下载 `figma-snapshot.json`，替换仓库的 `source/figma-snapshot.json`。以后无需重复导入插件。普通开发插件读不到文件 key，插件以现有 Typography 集合 ID 校验文件，避免在其他文件误导出。插件只读，不上传数据。
3. 运行 `npm run build:tokens` 重新生成 `tokens/` JSON 和 `viewer/index.html`，再运行 `npm run check:tokens` 校验两者与快照一致。`npm run build:site` 会校验数据并生成 Vercel 部署用的 `dist/index.html`。需要 Node.js 20 或更新版本，无需安装依赖。
4. 按 [变量交付规则](docs/token-rules.md) 检查变化，在 [变更记录](CHANGELOG.md) 写明新增、修改、删除和受影响页面/组件。
5. 提交 GitHub Pull Request；开发检查 JSON 差异、两国模式及别名。合并到 `main` 后，Vercel 从该分支自动构建在线浏览页，开发接入 `tokens/` JSON。后续迭代重复此流程。

若导出出现新集合、新模式或新文本样式，生成器会报错；先确认交付规则，再更新映射，避免静默漏导。若 Figma 字体不可用，保留实际字体名称并在开发接入前明确替代方案，不在导出时悄悄替换。

## 开发接入与验收

- 按 `tokens/manifest.json` 核对数量：当前 51 个变量、4 个文本样式；Indonesia / Kenya 的语义颜色各 25 个。
- 按目标市场选择一份 `semantic-color.*.json`，其他三类变量共用。颜色 `$value` 中 `components` 是 0–1 sRGB，`alpha` 单列；不要只取 `hex` 而丢失透明度。
- `$extensions.figma.alias` 表示原始 Figma 别名关系；当前已解析值可直接使用，别名元数据用于追踪与复核。
- 文本样式在 `text-styles.json` 单列；查看 `variableBindings`，不要只凭字号推断字重。当前 Figma 文本样式使用 PingFang SC，尚未确认移动端实际字体可用性。
- 首次接入时选 Indonesia 和 Kenya 各一张代表页面，对照 Figma 检查颜色、圆角、间距、文本样式。Figma Dev Mode 可查看节点的变量绑定和模式值。

此仓库只保存设计交付版本。确定移动端技术栈且手动交付成为负担后，再评估平台代码生成或自动发布。
