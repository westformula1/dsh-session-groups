# 发布到 DSH 插件市场

> 第一次用 npm/GitHub：直接看更详细的 [START_HERE.md](START_HERE.md)（一步一步点哪里、复制什么命令）。本文件是完整参考。

开放插件市场（[dshopen.org](https://dshopen.org/zh/)）由社区索引 [polang233/dsh-plugin-index](https://github.com/polang233/dsh-plugin-index) 维护。收录流程是：**公开源码仓库 + 可安装的 npm 包 + 提交收录申请**。索引每 6 小时构建一次，审核通过后自动出现。

## 0. 当前状态

已完成改名：**`dsh-session-groups`**（npm 查询可用），并同步修改了 `package.json`、`cordis.patch.yml`、`lib/client.js` 的模块 `id`、README 和本地 desktop profile 的 link 安装名。`private` 已移除。

仍缺三项（都需要你的账号）：

1. 公开 GitHub 仓库，以及 `package.json` 里的 `repository` / `homepage` / `author`；
2. 本机 npm 登录（当前没有 `.npmrc`，`npm whoami` 失败）；
3. 提交市场收录申请（需要 GitHub 账号；本机没有 `gh` CLI）。

### 为什么改名

`dsh-session-tree` 已被 [zhengqingjing 的另一个插件](https://www.npmjs.com/package/dsh-session-tree)（Git-like session lineage）占用。`dsh-session-groups` 在 2026-11-11 查询仍可用，与本项目功能也更贴合。

改名影响：`package.json` 的 `name`、`cordis.patch.yml` 里的 bundle `name`、`lib/client.js` 顶部的模块 `id`，以及 desktop profile 里 `link:` 安装名。`MARK`、CSS 类名和 `localStorage` 存储键保持不变，已有分组数据不受影响。

## 1. 发布前检查清单

- [x] 选定包名 `dsh-session-groups`，`npm view` 确认未占用
- [x] `package.json`：`name` 已改、`private` 已移除、`version` 0.2.0、`keywords`/`license`/`publishConfig`/`engines` 已配置
- [ ] `author`、`repository`、`homepage`、`bugs`（等公开仓库地址）
- [x] `cordis.patch.yml` 的 `name`、`lib/client.js` 的模块 `id` 已改为 `dsh-session-groups`
- [x] README 安装段已改成公开包名，删除本机路径/用户名
- [ ] 准备 1–6 张真实使用截图（用演示数据，或遮盖工作区/会话标题与密钥）；本机 `docs/screenshots/` 已被 `.gitignore` 排除，公开截图可放 `docs/market/`
- [x] `assets/icon.svg` 可作为申请里的 Logo（维护者会转存到市场图标目录）
- [x] `npm pack --dry-run` 检查打包内容（需要重新跑一次确认新包名/文件列表）

## 2. 公开源码仓库

本目录目前不是 Git 仓库。建议仓库名与包名一致，例如 `dsh-session-groups`：

```powershell
cd D:\DSH会话分组
git init
git add .
git commit -m "dsh-session-groups 0.2.0"
git branch -M main
git remote add origin https://github.com/<你的用户名>/dsh-session-groups.git
git push -u origin main
git tag v0.2.0
git push origin v0.2.0
```

在 GitHub 创建仓库时选 **Public**，许可证选 **MIT**。把截图放到 `docs/` 并在 README 中引用。

## 3. 发布 npm 包

```powershell
npm login
npm whoami
npm view dsh-session-groups version   # 应 404
npm pack --dry-run
npm publish --access public
npm view dsh-session-groups version dist.tarball
```

注意：

- 如果选 scoped 名称，`--access public` 必填，否则默认私有。
- 每次更新先改 `version` 再发布；npm 不允许覆盖已发布版本。
- 发布前最好在干净 profile 里装一次验证：

```powershell
dsh plugin --profile market-test add dsh-session-groups@0.2.0
```

（`dsh` 不在 PATH 时，用 DSH 自带运行时或插件管理界面安装同样的包名与版本。）

## 4. 提交收录申请

打开模板：

<https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-add.yml>

填写建议：

- **插件地址**：`dsh-session-groups`（或 scoped 全名）；源码仓库也一并写上。
- **简短说明**：  
  「在 DSH 侧边栏为每个工作区增加可嵌套的会话分组树，支持分组/会话排序、移动、导入导出和本地落盘；仅改侧边栏显示，不修改会话数据。」
- **实际效果截图**：1–6 张；建议包含分组树、移动会话菜单、排序菜单；遮盖个人信息。
- **补充信息**：  
  - Logo：`https://raw.githubusercontent.com/<用户名>/dsh-session-groups/main/assets/icon.svg`
  - 已验证：DSH `0.2.2-rc.1`，Windows 桌面端
  - 分类：`interface`
  - 数据只写本机 `$DSH_HOME/storages/dsh-session-tree/state.json`，无网络请求

维护者会审核源码、npm 包、许可证和实际效果；通过后索引构建（约每 6 小时）会生成条目。

### 可直接粘贴的申请文案

- 插件地址：`dsh-session-groups`（npm 发布后）；源码：`https://github.com/<你的用户名>/dsh-session-groups`
- 简短说明：  
  「在 DSH 侧边栏为每个工作区增加可嵌套的会话分组树，支持分组/会话排序、移动、导入导出和本地落盘；只改侧边栏显示，不修改会话数据。」
- 实际效果截图：1–6 张，建议包含分组树、移动会话菜单、排序菜单；用演示数据或遮盖个人信息。
- 补充信息：  
  - 分类：`interface`
  - Logo：`https://raw.githubusercontent.com/<你的用户名>/dsh-session-groups/main/assets/icon.svg`
  - 已验证：DSH `0.2.2-rc.1`，Windows 桌面端
  - 隐私：只写本机 `$DSH_HOME/storages/dsh-session-tree/state.json`，无网络请求

## 5. 收录之后

- 用户在你的 README 里看到安装方式，也可以在 DSH「发现」里添加索引源：

  ```text
  https://dshopen.org/index.json
  ```

- 收录后可以放徽章（把包名中的 `@` 写成 `%40`，`/` 保留）：

  ```md
  [![开放插件市场](https://img.shields.io/endpoint?url=https%3A%2F%2Fdshopen.org%2Fbadge%2Fdsh-session-groups.json)](https://dshopen.org/zh/plugins/dsh-session-groups/)
  ```

- 更新版本：改 `version` → `npm publish` → 等索引重建。市场当前对已安装插件显示 `update-available`，但**不支持原地升级**，需要卸载后重装。
- `engines.dsh` 要随实际测试版本维护；写得太宽会让不兼容版本也显示可安装。

## 6. 本地改名记录（已完成）

1. `package.json`：`name` = `dsh-session-groups`，`private` 已移除。
2. `cordis.patch.yml`：`name: dsh-session-groups`。
3. `lib/client.js` 第 2 行：`id: "dsh-session-groups"`。
4. `C:\Users\admin\.dsh\profiles\desktop\package.json`：
   - `dependencies` 为 `"dsh-session-groups": "link:D:/DSH会话分组"`
   - `dsh.profile.bundles` 里为 `dsh-session-groups`
5. 已重建 profile 的 `node_modules` junction，执行了 `pnpm install`，并通过插件管理器重启 bundle；当前条目为 `include:ui-session-tree`，`moduleName` 是 `dsh-session-groups`，状态 `active`。
6. `MARK`、CSS 类名、`localStorage` 键、落盘目录 `storages/dsh-session-tree/` 保持不变，已有分组数据会保留；这些内部名字不再对外显示，避免做破坏性迁移。
