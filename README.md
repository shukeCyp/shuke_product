# 🛍️ shuke-product — 带货视频工作流

8 个 Hermes 技能 + 带货视频分析参考库，用于短视频带货脚本、商品图生成、视频生成和竞品分析。

## 一键安装（小白通用）

### 第一步：安装技能

启动 Hermes 后，发送以下指令：

> **「帮我从 git@github.com:shukeCyp/shuke_product.git 安装带货工作流」**

Hermes 会自动 clone 仓库、复制技能、检查配置，等待完成即可。

### 第二步：配置 API Key

安装完成后，发送以下指令让 Hermes 帮你配置：

> **「帮我配置 shuke-product：云雾 API Key 填 xxx，图片生成和视频生成的 provider 都设置成超稳 AI，图片 Key 填 xxx，视频 Key 填 xxx」**

（把 `xxx` 分别替换成你自己的云雾 Key、超稳 AI 图片 Key、超稳 AI 视频 Key）

### 第三步：开始使用

直接发送：

> **「product-image-video-storyboard + 你的产品图片」**

然后等待 Hermes 生成结果即可。

### 手动安装（如果不想让 Hermes 自动处理）

```bash
git clone git@github.com:shukeCyp/shuke_product.git ~/Documents/shuke_product
cp -R ~/Documents/shuke_product/skills/shuke-product ~/.hermes/skills/shuke-product
cd ~/Documents/shuke_product
hermes
# → 问：「帮我配置 shuke-product」
```

---

## 目录结构

```
shuke_product/
├── README.md
├── skills/shuke-product/             # 8 个 Hermes 技能
│   ├── config/
│   │   ├── media_services.example.yaml   # 配置模板（不含真实密钥）
│   │   └── media_services.yaml           # 本地密钥配置（.gitignore 排除）
│   ├── commerce-script-retrieval/        # 带货脚本检索
│   ├── commerce-video-tagging/           # 带货视频打标
│   ├── cloudy-veo-generation/            # VEO 视频生成
│   ├── flow2api-media-generation/        # 图片 & 视频生成
│   ├── nanobanana2-image-prompting/      # Nano Banana 提示词
│   ├── product-image-video-storyboard/   # 商品图/视频分镜
│   ├── veo31-video-prompting/            # Veo 3.1 提示词
│   └── yunwu-video-commerce-analysis/    # 视频带货分析
├── skills/shuke-product/vault/        # 参考库
│   ├── index/videos.jsonl
│   ├── tags/
│   ├── analyses/
│   ├── taxonomy/
│   ├── hooks/
│   └── schemas/
└── product/                              # 生成产物
```

---

## 各服务配置

| 服务 | 用途 | URL | Key |
|------|------|-----|-----|
| **Flow2API** | 图片生成 / 视频生成 | 按需配置（每台机器可能不同） | 按需配置 |
| **Cloudy VEO** | VEO 3.1 视频生成 | `https://api.dealonhorizon.us`（固定） | 填入你的 key |
| **Yunwu** | 视频分析（Gemini） | `https://yunwu.ai`（固定） | 填入你的 key |

首次安装后，问 Hermes **「帮我配置 shuke-product」** 它会引导你填写 `skills/shuke-product/config/media_services.yaml`。

---

## 更新（小白通用）

直接发送以下指令给 Hermes：

> **「帮我从 git@github.com:shukeCyp/shuke_product.git 更新带货工作流」**

Hermes 会自动拉取最新代码并覆盖技能文件，等待完成即可。

---

## 常见问题

**Q：另一台电脑上 Hermes 没有 Vision 模型怎么办？**
A：问 Hermes：「帮我配置 Vision 模型」，它会检查 ~/.hermes/config.yaml 并指导配置。

**Q：怎么看技能有没有加载成功？**
A：问 Hermes：「检查 shuke-product 技能」或「列出所有技能」。

**Q：其他电脑没有 SSH 密钥访问 GitHub 怎么办？**
A：用 HTTPS 地址：`https://github.com/shukeCyp/shuke_product.git`
