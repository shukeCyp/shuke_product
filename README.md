# 🛍️ shuke-product — 带货视频工作流

8 个 Hermes 技能 + 带货视频分析参考库，用于短视频带货脚本、商品图生成、视频生成和竞品分析。

## 一键安装

在任何一台装了 Hermes 的电脑上，启动后直接说：

> **「帮我从 git@github.com:shukeCyp/shuke_product.git 安装带货工作流」**

Hermes 会自动：

1. `git clone` 这个仓库
2. 将 `skills/shuke-product/` 复制到 `~/.hermes/skills/shuke-product/`
3. 检查 `media_services.yaml` 密钥配置
4. 检查 `~/.hermes/config.yaml` Vision 辅助模型
5. 验证所有 8 个技能是否加载成功

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

## 更新

### 本机拉取最新版本

在本机项目目录下：

```bash
git pull
```

然后问 Hermes：

> **「帮我更新 shuke-product 技能」**

Hermes 会用最新的 `skills/shuke-product/` 覆盖 `~/.hermes/skills/shuke-product/`，并提醒你 vault/ 是否有变化。

### 另一台电脑同步

登录那台机器，启动 Hermes 后问：

> **「帮我从 git@github.com:shukeCyp/shuke_product.git 更新带货工作流」**

Hermes 会自动 `git pull` 并复制最新的技能和参考库。

---

## 常见问题

**Q：另一台电脑上 Hermes 没有 Vision 模型怎么办？**
A：问 Hermes：「帮我配置 Vision 模型」，它会检查 ~/.hermes/config.yaml 并指导配置。

**Q：怎么看技能有没有加载成功？**
A：问 Hermes：「检查 shuke-product 技能」或「列出所有技能」。

**Q：其他电脑没有 SSH 密钥访问 GitHub 怎么办？**
A：用 HTTPS 地址：`https://github.com/shukeCyp/shuke_product.git`
