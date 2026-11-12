# dsh-session-groups

在 DSH 桌面端（Web GUI）的左侧会话列表里，为**每个工作区内部**增加一层可嵌套的“会话分组”树。

DSH 原生的层级是：

```text
工作区 → 会话
```

本插件在会话之上增加用户自定义的分组（虚拟文件夹），不改变会话本身：

```text
工作区
├── 需求分析
│   ├── 会话 A
│   └── 子分组：方案设计
│       └── 会话 B
└── 未分组
    └── 会话 C
```

分组只是侧边栏的显示组织方式，不会修改会话的工作目录、日志、归档状态或所属工作区。

## 功能

- 每个工作区独立维护自己的分组树
- 新建根分组、新建子分组
- 工作区右键 **新建会话**：在该工作区直接创建并打开新会话
- 分组右键 **在此分组新建会话**：新会话创建后直接归入该分组，无需再移动
- 行内重命名（Enter 提交，Esc 取消）
- 折叠 / 展开分组，分组标题显示会话数量
- 通过右键菜单“移动会话”归类会话，也可直接拖拽会话到分组标题
- 同一分组内可自定义排序：右键会话 → **排序** → 移到最前 / 上移 / 下移 / 移到最后；可一键恢复默认顺序
- 工作区内的分组（含子分组）可在同级中调整顺序：右键分组 → **分组排序** → 移到最前 / 上移 / 下移 / 移到最后 / 按名称排序
- 拖拽分组标题到另一个分组可改变层级；拖到工作区标题可移回顶层
- 删除分组时，组内会话和子分组会上移到上一级，并自动展开目标分组，不会删除会话
- “未分组”作为默认分组，可接收未归类会话
- 分组和归类关系自动落盘到 DSH 主目录（原子写入并保留 `.bak` 备份），浏览器 `localStorage` 只作为缓存和降级
- 支持导出 / 导入分组数据，方便备份、迁移和分享
- 同一浏览器的多个标签页通过 `localStorage` 事件自动同步
- 工作区右键菜单增加：新建会话、新建分组、显示全部会话、展开全部分组、折叠全部分组、导出分组数据、导入分组数据
- 打开有分组的工作区时自动展开被原生“显示更多”隐藏的会话，保证分组树完整

## 使用

1. 右键工作区标题 → **新建分组**（或右键已有分组 → **新建子分组**）。
2. 输入分组名，按 Enter。
3. 新建会话：
   - 右键工作区 → **新建会话**：在该工作区创建并打开；
   - 右键分组 → **在此分组新建会话**：创建后直接归入该分组。
4. 归类会话：
   - 右键会话 → **移动会话** → 选择目标分组，或选择 **新建分组并移入…**；或
   - 把会话行拖到分组标题上。
5. 在分组标题上：
   - 点击箭头 / 标题：折叠或展开
   - `+`：新建子分组
   - 铅笔：重命名
   - 垃圾桶：删除分组（有确认）；会话和子分组会移到上一级并自动展开
   - 右键：新建会话 / 新建子分组 / 重命名 / 折叠 / 移到顶层 / 分组排序 / 删除
6. 会话排序：右键组内会话 → **排序** → 移到最前 / 上移 / 下移 / 移到最后；需要回到原生顺序时选 **恢复默认顺序**。
7. 分组排序：右键分组 → **分组排序** → 移到最前 / 上移 / 下移 / 移到最后；同级分组也可按名称重排。
8. 要取消归类：右键会话 → **移动会话** → **移出分组**，或把会话拖到“未分组”。
9. 备份或迁移：右键任意工作区 → **导出分组数据**，会下载一个 JSON 文件；在新机器或重装后右键工作区 → **导入分组数据** 选择该文件即可。导入会替换当前全部分组，不会删除任何会话。

> 分组树只出现在原生“分组方式 = 工作区 / 工作区树”的列表中。搜索结果是临时平铺列表，不显示分组；切回工作区列表后分组会恢复。

## 安装

```powershell
dsh plugin --profile desktop add dsh-session-groups
```

或在 DSH 的插件市场 / 插件管理界面里安装。安装后刷新 Web GUI（Ctrl+R）即可加载。

本地开发时可以用 `link:` 指向仓库目录：

```powershell
dsh plugin --profile desktop add link:C:\path\to\dsh-session-groups
```

## 发布到插件市场

见 [PUBLISHING.md](PUBLISHING.md)。第一次接触 npm/GitHub 的话，直接照 [START_HERE.md](START_HERE.md) 的傻瓜步骤操作。包名已从 `dsh-session-tree` 改为 `dsh-session-groups`，避免和 npm 上的同名插件冲突；内部存储键和落盘目录暂时沿用 `dsh-session-tree`，以兼容已有分组数据。

## 数据与重置

- 落盘位置：`$DSH_HOME/storages/dsh-session-tree/state.json`。默认 `$DSH_HOME` 是 `C:\Users\<你>\.dsh`（Windows）或 `~/.dsh`；设置过 `DSH_HOME` 时以该变量为准。
- 每次修改分组后约 250ms 防抖写入；写入先写临时文件再 `rename` 原子替换，并把上一版保留为 `state.json.bak`。
- 浏览器 `localStorage["dsh-session-tree.state.v1"]` 仍会同步写入，作为启动缓存与宿主不可用时的降级；首次升级时如果磁盘上还没有数据，会自动把现有 localStorage 分组搬到磁盘。
- `state.revision` 是单调递增的本地编辑计数：启动时如果浏览器里的 revision 比磁盘文件新（例如刚改完就关闭页面），会以浏览器版本为准并重新写盘，避免丢失最后一次修改。
- 同时打开多个窗口时，保存前会比较 `localStorage` 里的 revision；落后窗口不会覆盖较新的分组，而是重新载入新状态并提示“已同步另一个窗口的分组更新”。
- 数据只在本机；不会上传，也不会跨设备同步。需要迁移时用“导出 / 导入分组数据”。
- 重置所有分组：在开发者工具 Console 执行

```js
window.__DSH_SESSION_TREE__.reset()
```

这会把空状态同时写回磁盘和 localStorage。也可以先备份、再直接删除 `state.json` 后刷新页面。

在 Console 里也可以直接拿到/导入 JSON：

```js
window.__DSH_SESSION_TREE__.exportJson()      // 返回导出 JSON 字符串
window.__DSH_SESSION_TREE__.importJson(text)  // 弹出确认后整份替换
```

导出文件格式：

```json
{
  "format": "dsh-session-tree",
  "version": 1,
  "exportedAt": "2026-11-11T08:00:00.000Z",
  "state": {
    "version": 1,
    "revision": 12,
    "workspaces": {
      "<workspaceId>": {
        "groups": [{ "id": "g-…", "name": "需求分析", "parentId": null, "order": 1, "collapsed": false }],
        "assignments": { "<sessionId>": "g-…" },
        "sessionOrder": { "<sessionId>": 0 },
        "ungroupedCollapsed": false
      }
    }
  }
}
```

## 实现说明

插件不替换官方 `ui-workspace` 组件，而是在其 DOM 上做增强：

- 通过稳定的 React 行键 `data-row-key="workspace:<id>"` / `session:<id>` / `overflow:<id>` 定位行，不依赖 CSS Module 哈希类名。
- 每个工作区的 group section 被设为纵向 flex；官方行外层 wrapper 通过 CSS `order` 排序，因此不会移动 React 管理的节点。
- 分组标题是插件自己的 DOM，挂在工作区 section 下；`display: contents` 让标题参与同一套 flex 排序。
- `MutationObserver` 监听行增减，重新计算分组布局。
- 分组右键菜单通过 `ctx.contextMenus` 注册一个插件私有 target；会话/工作区菜单通过官方 API 追加动作。
- 归类关系按 `workspaceId → sessionId → groupId` 保存；不修改会话数据。
- 宿主半侧通过 `ctx.webServer` 注册已认证的 `/session-tree` 前缀路由（`load` / `save`），用官方 Connection 的 `requestRejection` 校验浏览器凭证；不依赖浏览器端 `connection.rpc` 的 HTTP 转发。
- 宿主只做结构校验、大小上限和原子文件写入；名称、父链、归类关系仍由客户端 `sanitizeState` 修正。
- Connection 服务不可用（例如非 Web combo）时只允许回环地址访问；客户端仍照常退回 `localStorage`。

## 兼容性

- 目标版本：DSH `0.2.2-rc.1`（桌面端 Web GUI）。
- 依赖官方行上的 `data-row-key` 约定和 `sidebar.workspaces` 区域的 DOM 结构。DSH 大版本升级后如果行结构变化，需要同步调整 `sectionForElement` / `wrapperOf`。
- 宿主落盘依赖 Web combo 的 `webServer` 与 `connection` 服务；`connection` 缺失时只允许回环地址读写，不退回 localStorage。
- 不使用构建步骤：直接编辑 `lib/client.js`，刷新页面即可生效；修改 `lib/index.js` 后建议重启 DSH。插件管理的关闭/启用可能触发 HMR 重载宿主，但已打开的页面可能仍持有旧客户端 bundle，需要重新加载甚至重启才能恢复。

## 已知限制

- 插件排序是“分组内显示顺序”，不改变 DSH 原生工作区顺序；使用过插件排序的分组会以插件顺序为准，直到选择“恢复默认顺序”。原生拖拽调整的是工作区整体顺序，两者不是同一个数据。
- 分组只在“按工作区分组 / 工作区树”视图生效；平铺视图和搜索结果不显示。
- 原生“显示更多”隐藏的会话需要先展开（插件会自动尝试展开有分组的工作区，也可用工作区右键“显示全部会话”）。
- 分组数据落在 `$DSH_HOME` 下；同一台机器、同一个 DSH 主目录的多个 profile 共用一份文件，不同主目录不共享，也不会跨设备同步。
- 导入是“整份替换”，不是合并；导入前建议先导出一份当前数据。
- 不支持跨工作区移动会话：DSH 的会话归属由会话工作目录/工作区记录决定，插件只保存显示分组；把会话显示到另一个工作区会与原生归属、权限和工作目录语义冲突。跨区需求应通过“在目标工作区新建会话”完成，而不是移动。
- 落盘依赖 `webServer` 路由和 Connection 认证；`connection` 缺失时只允许回环地址访问。客户端 RPC 失败或宿主不可用时，数据保留在浏览器 `localStorage`，并在 Console 给出警告。
- 插件通过 DOM 增强官方列表，不提供官方 API 级别的替换；如果 DSH 改变侧边栏 DOM 结构，需要适配。
