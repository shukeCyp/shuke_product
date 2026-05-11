# shuke_product

这个仓库主要是一个带货视频分析与选题生产库，围绕 `剧本/` 的历史素材库和 `product/` 的单个产品项目目录展开。

## 仓库结构

- `剧本/`：视频分析结果、标签、索引和分类体系。
- `product/`：每个产品对应一个独立项目目录。
- 当前项目示例：`product/20260512_021309_lemon_turmeric_kojic_soap/`

## 当前产品项目

当前产品项目记录的是 `SNYD Lemon Turmeric Kojic Acid Soap` 的短视频策划，包含：

- `00_foundation_prompts.md`：产品、人物、场景三类基础提示词
- `script.md`：分镜、口播、首帧提示词和视频提示词
- `references.json`：参考素材与匹配记录
- `prompts.json`：结构化提示词数据
- `generation_results.json`：生成结果记录
- `generate_media.py`：生成脚本

## 已读取的 Skills

### 仓库内技能

- `commerce-script-retrieval`
- `commerce-video-tagging`
- `flow2api-media-generation`
- `nanobanana2-image-prompting`
- `product-image-video-storyboard`
- `veo31-video-prompting`
- `yunwu-video-commerce-analysis`

### 全局技能

- `chinese-writing`
- `content-research-writer`
- `media-writer`
- `hatch-pet`
- `imagegen`
- `openai-docs`
- `plugin-creator`
- `skill-creator`
- `skill-installer`

## 使用方式

1. 先在 `剧本/` 中查找可复用的视频案例和标签。
2. 再在 `product/` 下建立或更新对应产品目录。
3. 需要生成图片、视频、分镜、文案或标签时，优先调用匹配的 skill。

## 说明

这个仓库没有统一的应用入口，内容主要是数据、提示词和生成产物。后续如果增加新的产品项目，可以继续沿用 `product/YYYYMMDD_HHMMSS_slug/` 的目录方式。
