# voxsmith

> **3 步搭一个属于自己的语音转写小工具**
>
> 不用装任何软件、不用碰命令行，全程在浏览器里点鼠标。
> 5 分钟以后你就拥有一个"按一下说话 → 自动转成文字 → 自动复制"的小窗口工具，
> 挂在自己的 Cloudflare 账号上，全球都能访问。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mirrorcaption/voxsmith)

下面这套"三步法"是 **新手推荐路线** —— 借助 GitHub 一键同步，不用装任何软件、不用碰命令行。
如果你不想注册 GitHub，也可以看文末的 [另一种方式（命令行版）](#另一种方式命令行部署不连-github)。

---

## 第 1 步：注册两个免费账号

如果你没有这两个，先去注册一下，都是免费的、邮箱注册即可，**不需要绑卡**：

- [Cloudflare](https://dash.cloudflare.com/sign-up) —— 用来跑这个小工具的"地基"
- [GitHub](https://github.com/signup) —— 用来存放项目代码，Cloudflare 会从这里拉取

> 两个账号都已经有了的话，直接看下一步。

---

## 第 2 步：点一下"一键部署"按钮

点下面这个按钮，在新窗口里打开：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mirrorcaption/voxsmith)

接下来会看到一系列网页，按提示点就好：

1. 先登录 Cloudflare（如果还没登）
2. 授权连接 GitHub，它会把项目代码复制到你自己的 GitHub 账号下一份
3. 选你要部署到的 Cloudflare 账号 → 点 **Deploy**

然后等大约 1 分钟，Cloudflare 会自己在云端把项目编译并部署好，最后给你一个网址，大概长这样：

```
https://voxsmith.你的名字.workers.dev
```

> 这一步把整个项目复制到了你自己的账号下 —— 以后是 **你的** 项目，作者改不了、也看不到你录的内容。

---

## 第 3 步：⚠️ 给项目设一个访问密码（**务必完成**）

> ### ⚠ 重要安全提示
>
> 刚部署出来的网址 **全世界任何人都能打开使用**。
> 别人录的音会消耗你 Cloudflare 账号的免费额度，严重时可能产生费用。
> **这一步不是可选，一定要做。**

在浏览器里，按下面这条路径点过去：

**Cloudflare 后台** › **Workers & Pages** › **voxsmith** › **Settings** › **Variables and Secrets**

点 **+ Add**，在弹窗里：

- 类型选 **Secret**
- 名称填：`BASIC_AUTH_PASSWORD`（一字不差）
- 值填：你自己想用的密码 —— 建议长一点，比如一句话拼起来
- 点 **Deploy** 保存

保存以后立即生效。再次打开你的网址，浏览器会弹一个登录框，用户名随便填（留空也行），密码就是你刚才设的那个。

> ### ✓ 大功告成
>
> 现在这个网址就是你的私人工具了。
> 收藏成书签，手机也能直接打开用，密码记到密码管理器里就行。

---

## 怎么用

- **按一下"开始说话"** → 开始录音，再按一下停止
- 停止后会自动把转好的文字复制到剪贴板，直接粘贴到任何地方
- **长按停止按钮** 可以选"停止不复制"，方便先编辑再粘贴
- 结果框可以直接编辑，改完再点复制按钮
- 顶部下拉菜单切换 "清理 / 轻润色 / 结构化" 几种处理风格
- 左侧 **自定义词汇** 面板可以填专有名词或行业术语（保存在浏览器本地）。这些词会被同时塞给 Whisper（影响识别）和 refine（强制规范拼写）—— 所以哪怕 Whisper 把 `GIT` 听成 `git`，refine 阶段会把它纠回 `GIT`
- 改完结果后，**学习修改** 按钮会自动找出你新加进去的专有名词（驼峰命名、全大写缩写、含数字的标识符等），勾选后一键加入自定义词汇，下次录音直接生效

---

## 进阶：直连 API 模式（用自己的额度）

主面板下面有个 **⚙ 直连 API · 用自己的额度** 按钮。填进去一对 **Account ID** + **API Token** 以后，前端会跳过部署者的 Whisper 调用，直接拿你的 token 去 `api.cloudflare.com` 跑，**消耗的是你自己 Cloudflare 账号的额度**。

适合两种情况：

- 别人分享了一个 voxsmith 给你用，但你不想占用 ta 的免费额度
- 自己部署的同时也希望朋友用，但希望各人各付各的（让朋友填自己的 token 即可）

### 1. 拿 Account ID

登录 [Cloudflare 后台](https://dash.cloudflare.com)，进任意一个 Workers & Pages 项目，**右侧边栏** 就有 "Account ID"，点一下复制（32 位十六进制字符串）。

### 2. 创建 API Token

在浏览器里按下面这条路径点过去：

**Cloudflare 后台** › 右上角头像 › **My Profile** › **API Tokens** › **Create Token** › 找到 **Custom token** 那行点 **Get started**

在创建页面：

- **Token name**：随便填，比如 `voxsmith-whisper`
- **Permissions**：只加一条 → `Account` · `Workers AI` · `Read`
- 其它选项保持默认，点 **Continue to summary** → **Create Token**
- **立刻复制** 显示出来的 token，关掉页面就再也看不到了

> ### ⚠ Token 权限只勾 Workers AI Read
>
> 千万别图省事勾上 Edit 或 Account 级别。万一这个 token 泄露，攻击者最多帮你跑光 Whisper 额度，不会动到你账号别的东西。

### 3. 填进 voxsmith

回到部署好的 voxsmith 页面，点 **⚙ 直连 API · 用自己的额度** 按钮：

- **Account ID** 粘第一步的字符串
- **Cloudflare API Token** 粘第二步生成的 token
- **Cerebras API Key**（可选）粘你的 Cerebras key —— 留空就跳过 refine，填了就在浏览器里直接调 `api.cerebras.ai` 的 `gpt-oss-120b` 做清理 / 润色 / 结构化
- 点 **保存**

按钮旁边的徽章会从 "未启用" 变成 "已启用"（或 "已启用 · refine"，如果你也填了 Cerebras key）。录一段试一下，状态栏出现 **完成 · 直连 ✓** 就成了。

> 所有 key 只存在你这台浏览器的 `localStorage`，不会上传到任何服务器，也不会跨设备同步。换浏览器需要再填一次。想关掉直连模式：进同一个 modal，点 **清除**。

### 4. （可选）开启 Cerebras refine

如果想在直连模式下也用清理 / 润色 / 结构化，去 [cerebras.ai](https://cerebras.ai) 注册一个免费账号 → 后台找到 **API Keys** → 创建一个新 key，粘到上面的 **Cerebras API Key** 输入框里。前端会用同一份 system prompt（包含你的自定义词汇）直接调它的接口，整个 refine 流程不经过 voxsmith 服务器、用的是你自己的 Cerebras 配额。

> 模型固定 `gpt-oss-120b`，便宜且支持中英文。Cerebras 默认 token 配额对个人使用来说够用了。

### 限制

直连模式下没填 Cerebras key 的话，refine 就**跳过**，只输出 Whisper 原始转写。原因是 refine 默认走部署者的 OpenAI，前端绕过 Worker 就拿不到。填一把自己的 Cerebras key 就解锁。

---

## 作者用：部署一个 BYO-only 的公开版

如果你想公开分享自己的部署（比如照顾访问不到默认 `*.workers.dev` 的用户），但又不想让访客刷掉自己的 Workers AI 额度，可以用 **BYO-only 模式**：

- `/api/transcribe`（默认端点，吃部署者额度）会被直接返回 403
- 前端开机会自动获取 `/api/config`，识别出 BYO-only 后强制弹出 "直连 API" 模态框，并在主面板顶部加一条黄色提示条
- 任何想用的人都必须先填自己的 Account ID + Workers AI Token
- refine（清理 / 润色 / 结构化）也走访客自己的 Cerebras key —— 部署者完全不需要配 OpenAI key

### 部署步骤

在你的 **公开版 Worker**（建议用一个独立的 Worker 名，比如 `voxsmith-public`）的 Cloudflare 后台里：

**Cloudflare 后台** › **Workers & Pages** › `<你的公开 Worker>` › **Settings** › **Variables and Secrets**

- 加一条 **Variable**（注意不是 Secret）
  - 名称：`PUBLIC_BYO_ONLY`
  - 值：`true`
- **不要** 设 `BASIC_AUTH_PASSWORD`（公开嘛，加密码就没意义了）
- 点 **Deploy** 保存

> 你自己的私人部署不要碰这个变量，保持默认就好——两套部署用同一个 repo，差别只在 Cloudflare 后台的环境变量。

### 资源消耗预期

- **Workers AI 配额** ✓ 不消耗：Whisper 调用走访客自己的 token，计费到访客账号
- **Workers 请求次数 / CPU 时间** ⚠️ 算你头上：
  - 免费档：10 万请求/天、每请求 10ms CPU
  - 一旦流量上来（每天 1 万以上访客 × 多次录音），建议升 **Workers Paid（$5/月）**，配额扩到 1000 万请求/月 + 50ms CPU/请求，base64 编码大音频也不会撞上限

---

## 几个小提醒

- 单次录音建议不要超过 **30 秒**，这是模型的上限
- 免费额度日常自用完全够，如果用得很多，去 Cloudflare 后台看一眼额度
- 画中画浮窗需要 **Chrome 或 Edge 浏览器**（116 以上），Safari 上会自动变成普通页面也能用
- 密码不要发给别人；真要分享，让对方也走一遍这个流程，部署他自己的那一份
- 想改密码：回到第 3 步的位置，点那条 secret 后面的菜单 → Edit → 改新值 → Deploy

---

## 另一种方式：命令行部署（不连 GitHub）

<details>
<summary>展开看命令行部署步骤（进阶）</summary>

如果你不想注册 GitHub、又能接受装一个小工具，可以走这条路。
会用到电脑自带的"终端"（Mac 上叫 **终端**，Windows 上叫 **PowerShell**），粘贴命令回车即可，不需要写任何代码。

### 准备：装 Node.js

到 [nodejs.org](https://nodejs.org) 下载安装（选 **LTS** 那个绿色按钮）。装好后打开终端，输入 `node -v` 能看到版本号就 OK。

### 1. 下载项目代码

从作者提供的压缩包链接下载并解压，然后在终端里进入这个文件夹。

> 不会"进入文件夹"的话：Mac 把解压后的文件夹拖到终端窗口，Windows 在文件夹空白处右键选"在终端中打开"。

### 2. 安装依赖

```bash
npm install
```

> 大概几十秒，看到滚动文字停下来就好。

### 3. 登录 Cloudflare

```bash
npx wrangler login
```

会自动弹浏览器到 Cloudflare 授权页，点"允许"。

### 4. ⚠️ 设密码（**必做**，理由同上面第 3 步）

```bash
npx wrangler secret put BASIC_AUTH_PASSWORD
```

会让你输密码 —— 屏幕上不显示是正常的，输完回车即可。

### 5. 部署

```bash
npm run deploy
```

十几秒后，终端会打印出你的网址，打开即可。

</details>

---

## 给开发者：本地开发与定制

<details>
<summary>展开看技术细节</summary>

### 架构一句话

- **Worker** (`src/index.ts`) —— 接收 `POST /api/transcribe`，通过 `AI` binding 调用 `@cf/openai/whisper-large-v3-turbo`，按需通过 OpenAI 做 refine，返回 JSON。`?vocab=` query 参数同时塞给 Whisper 的 `initial_prompt`（影响识别）和 refine 的 system prompt 字典区块（强制规范拼写）。
- **共享 prompt 模板** (`src/refine/prompts.ts` + `public/refine-prompts.js`) —— 一份用于 Worker，一份镜像给浏览器，两边构造的 system message 完全一致。清理 / 润色 / 结构化各模式自动按检测到的中英文路由。
- **静态页** (`public/index.html`) —— 单按钮 MediaRecorder UI、自定义词汇面板、API 凭据 modal、"学习修改" 按钮（数据全存 `localStorage`）。在直连模式下浏览器可直接调 `api.cerebras.ai` 用 `gpt-oss-120b` 做 refine。
- **静态资源** 通过 Workers 的 `[assets]` binding 提供，无需另外托管。

整套都跑在 Cloudflare 边缘：录音字节打到最近的 PoP，Whisper 推理在 Workers AI 上完成，refine 默认走 OpenAI（直连 + Cerebras 路径则完全绕开本服务器）。

### 本地开发

```bash
pnpm install         # 或 npm install
wrangler login
pnpm dev             # wrangler dev → http://localhost:8787
```

`wrangler dev` 即使在本地也会把 Workers AI 调用代理到 Cloudflare，所以本地就能跑通转录。

### 用命令行部署

```bash
pnpm deploy          # wrangler deploy → https://voxsmith.<account>.workers.dev
```

### 绑定自己的自定义域名

打开 `wrangler.toml`，把里面注释掉的 `routes = [...]` 一段取消注释，把 `your.domain.com` 改成你自己的域名（需要先在 Cloudflare 里挂上这个 zone）。

### 技术备注

- Whisper 单次最长 ~30 秒音频。要做更长的语音流，需要客户端切片，或换成流式 ASR（AssemblyAI、Deepgram 等）。
- 自定义词汇用的 `initial_prompt` 是 *软提示*（≈224 tokens），Whisper 会向那些拼写偏移但不保证。这就是为什么同一份词典还会拼到 refine 的 system prompt 里作为"硬纠错"——即使 Whisper 听错了 `GIT` 听成 `git`，refine 也会按词典规范化回去。
- 页面用浏览器默认编码（一般是 `audio/webm;opus`）的 `MediaRecorder`，Whisper 通过 base64 接受主流格式。
- Workers AI 用量计入跑 `wrangler deploy` 的那个 Cloudflare 账号。免费额度有每日 neuron 配额，详见 Cloudflare 定价页。
- 想自己改 prompt 或加新模式：先改 `src/refine/prompts.ts`（Worker 用），再把同样的字符串同步到 `public/refine-prompts.js`（浏览器 Cerebras 路径用）。两文件顶部都有 keep-in-sync 注释。

</details>
