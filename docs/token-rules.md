# 变量交付规则（一页版）

**维护与发布**　设计师在 Figma 维护值；GitHub `main` 保存已审核交付。每次修改先导出快照、生成 JSON、提 Pull Request；合并后开发再接入。变量标识使用英文，说明文字使用中文。

**命名**　沿用 Figma 当前的语义层级，用 `/` 分隔分类和名称，如 `Background/AccentSurface`。导出 JSON 使用小写 kebab-case 路径，如 `background.accent-surface`。同一概念跨国家模式保持同一变量名。新增变量优先按用途/层级命名，不写具体色值；改名要在变更记录注明旧名和新名，开发同步更新引用。Figma 原名和 ID 仍保存在 `$extensions.figma`。

**四类变量**　`Typography` 管字体、字号、字重；`Dimensions` 管间距及描边宽度；`Radius` 管圆角；`Semantic Color` 管按界面含义使用的颜色。只使用已定义的值，不通过改动 Figma 原变量来适配代码。当前导出分别为 8、13、5、25 个变量。

**国家模式**　`Semantic Color` 有 Indonesia 和 Kenya 两套值，开发按用户所属市场选择对应文件。变量标识相同，具体值可以不同。Typography、Dimensions、Radius 目前共用一套。颜色的 alpha 必须保留；别名的目标信息在 `$extensions.figma.alias`，实际颜色在 `$value`。

**文本样式**　四个样式独立列在 `tokens/text-styles.json`：`heading1`、`heading2`、`body`、`caption`。按样式同时使用字体、字号、字重、行高与字距；不要只匹配字号。设计文件里的字体仍是 PingFang SC，开发需核对平台字体可用性后决定实际字体映射。

**变更处理**　新增：补充变量含义、两国值（如属于 Semantic Color）和使用位置。修改：写明旧值、新值和受影响页面/组件。改名：保留旧名→新名映射，通知开发迁移。删除：先确认页面及组件不再绑定，再从 Figma 删除并在 PR 中标明；导出脚本不会自动清理 Figma。每次更新 `CHANGELOG.md`，PR 同时检查 `source/` 和 `tokens/` 差异。

**验收**　运行 `npm run check:tokens`；数量与 Figma 表一致，别名可解析；Indonesia 和 Kenya 各抽查一张代表页面的颜色、间距、圆角、文本样式。异常先修复导出或映射，再合并 PR。
