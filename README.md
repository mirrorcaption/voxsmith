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
- 左侧 **自定义词汇** 面板可以填专有名词或行业术语（保存在浏览器本地），帮助识别器正确拼写它们

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

- **Worker** (`src/index.ts`) —— 接收 `POST /api/transcribe`，通过 `AI` binding 调用 `@cf/openai/whisper-large-v3-turbo`，返回 JSON。`?vocab=` query 参数会作为 Whisper 的 `initial_prompt` 用来 bias 识别结果向用户提供的术语靠拢。
- **静态页** (`public/index.html`) —— 单按钮 MediaRecorder UI，含自定义词汇面板（数据存 `localStorage`）。
- **静态资源** 通过 Workers 的 `[assets]` binding 提供，无需另外托管。

整套都跑在 Cloudflare 边缘：录音字节打到最近的 PoP，Whisper 推理在 Workers AI 上完成，响应直接回来，没有 origin server。

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
- 自定义词汇用的 `initial_prompt` 是 *软提示*（≈224 tokens），Whisper 会向那些拼写偏移但不保证。要硬保证，可以加一道 LLM 后处理 pass。
- 页面用浏览器默认编码（一般是 `audio/webm;opus`）的 `MediaRecorder`，Whisper 通过 base64 接受主流格式。
- Workers AI 用量计入跑 `wrangler deploy` 的那个 Cloudflare 账号。免费额度有每日 neuron 配额，详见 Cloudflare 定价页。

</details>
