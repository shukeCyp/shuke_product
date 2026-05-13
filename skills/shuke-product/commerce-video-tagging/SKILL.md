---
name: commerce-video-tagging
description: Use this skill after video understanding to convert带货视频 analysis into standardized product/video/hook tags, JSON records, and searchable index entries saved under the current workspace's vault folder.
---

# Commerce Video Tagging

Use this skill after `yunwu-video-commerce-analysis` or whenever the user wants to tag, classify, normalize, or save a带货视频 analysis into a reusable素材库.

## Storage

Always use the current working directory's `skills/shuke-product/vault/` folder:

```text
skills/shuke-product/vault/
├── analyses/<video_id>/analysis.md
├── tags/<video_id>.json
├── index/videos.jsonl
├── schemas/video_analysis.schema.json
└── taxonomy/commerce_tags.json
```

If the folder or files do not exist, create them from this skill's structure.

## Tagging Workflow

1. Read the video analysis text.
2. Extract only facts supported by the analysis/video. Mark uncertain facts with `confidence < 0.7`.
3. Normalize product category, video type, hook type, proof type, audience, and CTA using the taxonomy.
4. Write `skills/shuke-product/vault/tags/<video_id>.json`.
5. Append or update one compact JSON object in `skills/shuke-product/vault/index/videos.jsonl`.
6. Keep `search_text` dense and useful for retrieval.

## Required JSON Shape

```json
{
  "video_id": "",
  "source": {
    "video_path": "",
    "analysis_path": "",
    "model": "",
    "duration_seconds": 0,
    "created_at": ""
  },
  "product": {
    "name": "",
    "category": "",
    "sub_category": "",
    "price_position": "",
    "target_audience": [],
    "confidence": 0.0
  },
  "tags": {
    "product_tags": [],
    "video_type_tags": [],
    "hook_tags": [],
    "proof_tags": [],
    "audience_tags": [],
    "risk_tags": [],
    "platform_tags": []
  },
  "hook": {
    "type": "",
    "first_3s_text": "",
    "mechanism": "",
    "retention_score": 0
  },
  "selling_points": [],
  "proof_points": [],
  "cta": {
    "text": "",
    "clarity": "none|weak|clear"
  },
  "scores": {
    "retention": 0,
    "clarity": 0,
    "trust": 0,
    "product_display": 0,
    "purchase_impulse": 0,
    "total": 0
  },
  "remake": {
    "angle": "",
    "script_outline": [],
    "shot_list": [],
    "voiceover": "",
    "subtitles": [],
    "ai_image_prompts": [],
    "ai_video_prompts": []
  },
  "search_text": ""
}
```

## Taxonomy

Use these canonical labels first. Add new labels only when none fit.

Product categories:

- `男士护理`, `女性护理`, `美妆护肤`, `身体护理`, `健康养生`, `家居清洁`, `厨房用品`, `数码配件`, `服饰穿搭`, `食品饮料`, `母婴宠物`, `运动户外`, `汽车用品`, `办公学习`, `其他`

Video type tags:

- `价格刺激`, `清仓福利`, `痛点解决`, `效果前后对比`, `质地实测`, `场景种草`, `UGC口播`, `剧情反转`, `库存背书`, `工厂源头`, `开箱展示`, `测评对比`, `直播切片`, `老板疯了`, `给老客户道歉`, `身份代入`, `礼物推荐`

Hook tags:

- `道歉钩子`, `别划走`, `身份点名`, `价格跳水`, `反常识`, `尴尬痛点`, `结果前置`, `库存震撼`, `限时稀缺`, `低价占便宜`, `好奇悬念`, `场景冲突`

Proof tags:

- `产品特写`, `库存展示`, `质地展示`, `手背实测`, `前后对比`, `用户评价`, `第三方背书`, `打包发货`, `工厂流水线`, `成分展示`, `尺寸容量`, `使用场景`, `无明显证明`

Risk tags:

- `无CTA`, `卖点单一`, `包装错字`, `AI包装痕迹`, `功效宣称风险`, `场景割裂`, `信任不足`, `字幕不清`, `口播缺失`, `产品不清晰`

## Search Text Pattern

Build `search_text` like this:

```text
产品：<name>。品类：<category>/<sub_category>。人群：<audience>。
视频类型：<video_type_tags>。钩子：<hook_tags>，<first_3s_text>。
卖点：<selling_points>。证明：<proof_points>。
风险：<risk_tags>。适合复刻：<remake.angle>。
```

This text is what `commerce-script-retrieval` searches when generating new scripts.

## Quality Rules

- Prefer fewer accurate tags over many vague tags.
- Keep tags canonical and Chinese.
- If the video only implies a claim, put it in `proof_points` or `selling_points` with careful wording.
- If no CTA appears, set `cta.clarity` to `none` and add `无CTA`.
- If packaging or text appears fake/wrong, tag `包装错字` or `AI包装痕迹`.
