---
name: commerce-script-retrieval
description: Use this skill to retrieve relevant tagged带货视频 examples from the workspace 剧本 library and generate new ecommerce scripts, shot lists, captions, and AI image/video prompts for a new product.
---

# Commerce Script Retrieval

Use this skill when the user has a new product and wants to find comparable带货视频 structures, scripts, hooks, or remake ideas from the local `剧本/` library.

## Library Path

Default library:

```text
<current working directory>/剧本/
```

Primary search file:

```text
剧本/index/videos.jsonl
```

Detailed records:

```text
剧本/tags/<video_id>.json
剧本/analyses/<video_id>/analysis.md
```

## Retrieval Workflow

1. Parse the new product brief:
   - product name/category
   - target audience
   - price position
   - core selling points
   - platform/language
   - desired video length
2. Load `剧本/index/videos.jsonl`.
3. Filter by product category and compatible audience.
4. Score candidates by:
   - product category match
   - video type match
   - hook type usefulness
   - proof mechanism match
   - remake angle usefulness
   - risk compatibility
5. Read the top 3-10 detailed tag files and analyses.
6. Generate an original script that borrows structure, not wording.
7. Output scripts plus AI generation prompts for image/video assets.

## Scoring Heuristic

Use this simple scoring if no vector search exists:

```text
+4 same product.category
+3 overlapping product/sub-category terms
+3 overlapping target audience
+3 overlapping desired video type
+2 compatible hook tag
+2 compatible proof tag
+1 strong score_total >= 7
-2 risk_tags include 包装错字 or AI包装痕迹 when user wants premium/trustworthy
-2 cta.clarity = none when user wants direct conversion
```

If many candidates tie, prefer records with clearer remake plans and more complete shot lists.

## Output Format

For a new product, return:

1. Matched reference videos
   - `video_id`
   - category
   - hook
   - why it matches
   - risks to avoid
2. Recommended script strategy
3. 15-second script
4. 30-second script
5. Shot list
6. Subtitle copy
7. Voiceover copy
8. CTA variants
9. Nano Banana image prompts
10. Veo video prompts

## Script Generation Principles

- Keep the winning structure, rewrite the expression.
- Use the new product's real selling points.
- Do not copy competitor brand names, exact subtitles, or claims.
- Preserve proven hooks only as formats: e.g. `道歉降价`, `库存震撼`, `痛点提问`.
- Add product proof shots: texture, use, before/after, scale, durability, speed, comfort.
- Add a clear CTA unless the user asks for soft seeding.

## Prompt Template

```text
新产品：
- 名称：
- 品类：
- 目标人群：
- 核心卖点：
- 价格定位：
- 平台：
- 时长：

请从 剧本/index/videos.jsonl 检索最匹配的带货视频结构，读取相关 tags/analysis，然后生成原创短视频带货脚本。
输出：参考视频、匹配原因、15秒脚本、30秒脚本、镜头表、字幕、口播、CTA、商品图提示词、视频提示词。
```

## Common Script Angles

- `价格刺激 + 库存背书`: good for low-price, clearance, mass-market products.
- `痛点解决 + 质地实测`: good for skincare, body care, health/personal care.
- `场景种草 + UGC口播`: good for lifestyle, fashion, home, travel products.
- `测评对比 + 效果前后对比`: good for functional products with visible proof.
- `身份代入 + 礼物推荐`: good for gendered gifts and couples/family products.
- `工厂源头 + 打包发货`: good for source-factory, low-cost, warehouse-proof content.

## Save New Scripts

When the user asks to produce a script, save it under:

```text
剧本/generated_scripts/<product_slug>_<date>/
├── script.md
├── references.json
└── prompts.json
```

Use a readable product slug in Chinese pinyin or sanitized Chinese.
