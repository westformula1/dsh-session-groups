# 从零发布到 DSH 插件市场（傻瓜版）

> 目标：把这台电脑上的 `D:\DSH会话分组` 发布成公开插件，别人能在 DSH 插件市场搜索到并安装。
>
> 你需要注册两个免费账号：**npm**（存放插件安装包）和 **GitHub**（存放源代码）。不用信用卡。

---

## 先看：网页提示“访问暂时受限”怎么办

这不是网站挂了，而是 GitHub 的 **DataDome** 或 npm 的 **Cloudflare** 安全验证拦截了当前网络/IP。按顺序试：

1. **换网络（最有效）**：手机开热点，电脑连手机热点，再打开网页。IP 变了通常就能过。
2. **不要点聊天里的链接**：复制网址到 **Edge / Chrome 正常窗口** 打开，不要用 DSH 内嵌浏览器。
3. **关掉 VPN / 代理 / 加速器**（包括浏览器插件）。DataDome 对机房/VPN IP 很敏感。
4. 清除 `github.com`、`npmjs.com` 的 Cookie；关闭广告拦截、跟踪防护、Edge“增强安全模式”；允许 JavaScript 和 Cookie。
5. 如果页面出现“验证你是人类 / 请稍候”，等它自动完成，不要关页面；有时要 10–30 秒。
6. 还不行就重启路由器/等一会儿再试。

### npm 可以完全绕开网页

npm 账号可以在 PowerShell 里创建，不需要打开 npm 网站：

```powershell
npm adduser --auth-type=legacy
```

按提示输入 **Username / Password / Email**（邮箱要真实）。如果账号已存在，改用：

```powershell
npm login --auth-type=legacy
```

然后：

```powershell
npm whoami
```

能显示用户名就说明登录成功，可以直接 `npm publish`。这条路径不受 npm 网页的 Cloudflare 影响。

### GitHub 网页始终打不开的备用方案

GitHub 注册没有官方 CLI，必须走网页（手机流量通常可以）。如果电脑上始终被 DataDome 拦截：

1. 用**手机移动数据**（不是 Wi-Fi）打开 `https://github.com/signup` 注册并验证邮箱。
2. 在手机 GitHub 网页：**Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)**。
3. 勾选 **`public_repo`**，有效期选 7 天，生成后复制 token。
4. 在电脑上把 token 保存到一个临时文件，例如 `C:\Users\admin\github-token.txt`，**不要发到聊天里**。
5. 告诉我 token 文件已准备好。`api.github.com` 在这台机器上可以访问，我可以用它建仓库、上传代码、提交市场申请，全程不再打开 GitHub 网页。用完会删除 token 文件，你也可以随时在 GitHub 撤销。

> 这是高级兜底方案；如果手机热点能让电脑正常打开 GitHub，优先用普通网页流程。

---

## 第 0 步：先注册两个账号

### 0.1 注册 npm

1. 打开 <https://www.npmjs.com/signup>。
2. 填 **Username**（用户名，会公开，建议用英文，例如 `你的名字-dsh`）、**Email**、**Password**。
3. 点 **Create Account**。
4. npm 会发验证邮件，去邮箱点验证链接。
5. 记住这个 **Username**，后面发布要用。

> npm 是插件安装包的仓库。发布后用户执行 `dsh plugin add dsh-session-groups` 就是从 npm 下载。

### 0.2 注册 GitHub

1. 打开 <https://github.com/signup>。
2. 填邮箱、密码、用户名（Username，会公开）。
3. 完成邮箱验证码/验证邮件。
4. 记住你的 **GitHub 用户名**。

> GitHub 存放源代码。插件市场的收录申请也通过 GitHub 提交。

---

## 第 1 步：在 GitHub 建一个公开仓库

1. 登录 GitHub 后，点右上角 **+** → **New repository**。
2. **Repository name** 填：`dsh-session-groups`
3. 选 **Public**（必须公开，否则市场无法读取）。
4. **不要**勾选 “Add a README file”“Add .gitignore”“Choose a license”（我们本地已经有这些文件）。
5. 点 **Create repository**。
6. 创建成功后，地址栏就是你的仓库地址，例如：

   ```text
   https://github.com/你的用户名/dsh-session-groups
   ```

   把这个地址记下来。

---

## 第 2 步：把本地代码传到 GitHub

推荐用 **GitHub Desktop**（图形界面，不需要敲 Git 命令）。

### 2.1 安装 GitHub Desktop

1. 打开 <https://desktop.github.com/download/>，下载 Windows 版。
2. 双击安装，安装完打开。
3. 点 **Sign in to GitHub.com**，用刚注册的 GitHub 账号登录（会打开浏览器，点授权）。

### 2.2 把本地目录变成仓库并上传

1. GitHub Desktop 菜单 **File → Add local repository…**。
2. 选择文件夹：`D:\DSH会话分组`。
3. 如果提示 “This directory does not appear to be a Git repository”，点 **create a repository**：
   - Name：`dsh-session-groups`
   - Local path：保持 `D:\DSH会话分组`
   - 不要勾选 “Initialize this repository with a README”
   - 点 **Create repository**。
4. 左侧会列出待提交文件。确认列表里**没有** `recovery` 文件夹，也**没有** `docs/screenshots`（这两个已被 `.gitignore` 排除）。
5. 左下角 **Summary** 填：`dsh-session-groups 0.2.0`
6. 点 **Commit to main**。
7. 顶部会出现 **Publish repository**，点它：
   - **Name**：`dsh-session-groups`
   - **取消勾选** “Keep this code private”（一定要公开）
   - 点 **Publish repository**。
8. 点 **Repository → View on GitHub**，确认浏览器里能看到 `lib/`、`package.json`、`README.md` 等文件，并且仓库是 **Public**。

> 如果不想装 GitHub Desktop：也可以在仓库页面点 “uploading an existing file”，把 `lib`、`assets`、`README.md`、`package.json`、`cordis.patch.yml`、`LICENSE`、`PUBLISHING.md`、`.gitignore` 拖进去。**不要**拖 `recovery` 和 `docs/screenshots`。

---

## 第 3 步：发布到 npm

### 3.1 打开 PowerShell

按 **Win 键**，输入 `PowerShell`，打开 **Windows PowerShell**。

### 3.2 进入插件目录

复制下面这行，粘贴到 PowerShell，按回车：

```powershell
cd "D:\DSH会话分组"
```

### 3.3 登录 npm

复制：

```powershell
npm login
```

按回车后会自动打开浏览器：

1. 用刚注册的 npm 账号登录。
2. 页面提示授权时点 **Authorize** / **Approve**。
3. 回到 PowerShell，看到 `Logged in as 你的用户名` 就成功了。

检查一下：

```powershell
npm whoami
npm view dsh-session-groups version
```

第一条显示你的 npm 用户名；第二条如果显示 `404 Not Found` 就说明包名还可用（可以发布）；如果显示了一个版本号，说明名字被抢了，先不要发布，把结果发我。

> 如果浏览器没有自动打开：PowerShell 里会打印一个网址，复制到浏览器打开即可。
>
> 如果 npm 要求开启两步验证（2FA）：按页面提示用手机验证器 App（Microsoft Authenticator / Google Authenticator）扫码，发布时输入 6 位数字。**不要把验证码发给任何人。**

### 3.4 发布

```powershell
npm publish --access public
```

成功后最后会出现类似：

```text
+ dsh-session-groups@0.2.0
```

第一次发布如果提示输入 6 位验证码，输入即可。

> 如果报错，把 **完整报错文字** 发我，不要自己反复试。
>
> 常见报错：
> - `ENEEDAUTH` / `E401`：没登录成功，重新 `npm login`。
> - `EOTP`：需要两步验证码，输入最新 6 位。
> - `403 ... name ... taken`：包名被抢了，告诉我，我帮你换一个备用名。

### 3.5 确认发布成功

浏览器打开：

```text
https://www.npmjs.com/package/dsh-session-groups
```

能看到页面就成功了。

---

## 第 4 步：提交到 DSH 插件市场

1. 打开申请页面（需要登录 GitHub）：

   <https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-add.yml>

2. **Plugin link** 填：

   ```text
   dsh-session-groups
   ```

   也可以加上你的仓库地址。

3. **Summary** 复制这段：

   ```text
   在 DSH 侧边栏为每个工作区增加可嵌套的会话分组树，支持分组/会话排序、移动、导入导出和本地落盘；只改侧边栏显示，不修改会话数据。
   ```

4. **Screenshots** 可选。第一次申请可以先跳过；想放的话用演示数据截图，别放含个人工作区/会话标题的图。

5. **Additional details** 填：

   ```text
   分类：interface
   已验证：DSH 0.2.2-rc.1，Windows 桌面端
   Logo：<你的仓库地址>/blob/main/assets/icon.svg
   隐私：只写本机 $DSH_HOME/storages/dsh-session-tree/state.json，无网络请求
   ```

6. 点 **Submit new issue**。

7. 提交后维护者会审核；通过后索引约每 6 小时构建一次。之后用户在 DSH「发现 → 索引源」添加：

   ```text
   https://dshopen.org/index.json
   ```

   就能搜索到并安装。

---

## 第 5 步：把结果告诉我

发布完成后，把下面几项发我（**不要发密码、验证码、token**）：

- 你的 GitHub 仓库地址（`https://github.com/...`）
- 你的 npm 用户名
- `npm publish` 是否成功；如果报错，发完整报错
- 市场 issue 的链接（如果已提交）

我会继续帮你补 `repository`/`homepage`/`author` 元数据、检查仓库文件、准备市场申请文案和后续版本发布。

---

## 常见问题

**Q：一定要 GitHub Desktop 吗？**
不是。会用命令行也可以；但 GitHub Desktop 不用记 Git 命令，最适合第一次。

**Q：npm 和 GitHub 要花钱吗？**
不用，公开仓库和公共 npm 包都免费。

**Q：发布后别人怎么装？**
在 DSH 插件市场点安装，或执行 `dsh plugin --profile desktop add dsh-session-groups`。

**Q：以后更新版本怎么办？**
改 `package.json` 的 `version`（例如 0.2.1）→ 重新 `npm publish` → GitHub Desktop 提交代码 → 市场索引会自动读取新版本。市场目前不支持原地升级，用户需要卸载后重装。

**Q：仓库里能看到我的私人会话吗？**
不会。`.gitignore` 已排除 `recovery/` 和 `docs/screenshots/`；用 GitHub Desktop 提交时注意确认文件列表。不要手动 `git add -f` 这两个目录。

**Q：npm 用户名/密码能发给你吗？**
不要。你只需要在本机登录；我从不需要你的密码或验证码。
