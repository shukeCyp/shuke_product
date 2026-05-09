---
name: yunwu-video-commerce-analysis
description: Use this skill to analyze ecommerce/short-form selling videos with Yunwu API's Gemini video-understanding endpoint, including local MP4/base64 preparation, request construction, structured product-video teardown, hook/scene/script/offer analysis, conversion scoring, and remake briefs for带货 videos.
---

# Yunwu Video Commerce Analysis

Use this skill when the user wants to analyze,拆解, score, summarize, reverse-engineer, or learn from a带货视频, product demo, UGC ad, Douyin/TikTok/Reels clip, or any short commerce video using Yunwu API video understanding.

## Default API

Apifox doc: https://yunwu.apifox.cn/api-309482709

Default endpoint:

```text
POST https://yunwu.ai/v1beta/models/gemini-2.5-pro:generateContent
```

Workspace preferred analysis model:

```text
gemini-3.1-pro-preview
```

For deeper ecommerce teardown, use:

```text
POST https://yunwu.ai/v1beta/models/gemini-3.1-pro-preview:generateContent
```

Use the Apifox `gemini-2.5-pro` endpoint as the compatibility fallback.

Default API key:

```text
sk-YnNkhgtXNcmSzTBCvufmxYfzg7oNOtWzDaZjhrgoA8ebdVEQ
```

Auth and request requirements from the Apifox page:

- Header: `Authorization: Bearer <token>`
- Query: `key=<api_key>`
- Header: `Content-Type: application/json`
- Body: Gemini native `contents[].parts[]`
- Video input: `inline_data` with `mime_type: "video/mp4"` and base64 `data`

Use both `Authorization: Bearer ...` and `?key=...` unless the user explicitly asks for one auth style only.

## Storage Hook

Always save video analysis outputs under the current working directory's `剧本/` folder.

For each analyzed video, create:

```text
剧本/
├── analyses/<video_id>/analysis.md
├── analyses/<video_id>/raw_response.json
├── analyses/<video_id>/request_meta.json
├── tags/<video_id>.json
└── index/videos.jsonl
```

Rules:

- `video_id` should be stable and readable: date/time + sanitized filename, or a short hash if needed.
- Save the model response text to `analysis.md`.
- Save the full API response to `raw_response.json`.
- Save model, source video path, duration, endpoint, and prompt name to `request_meta.json`.
- After analysis, run the `commerce-video-tagging` workflow to create `tags/<video_id>.json`.
- Append or update one compact searchable line in `index/videos.jsonl`.
- Do not save new analysis under `generated/` unless the user explicitly asks for a temporary experiment.

## Request Shape

Minimal shape:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inline_data": {
            "mime_type": "video/mp4",
            "data": "<base64_mp4>"
          }
        },
        {
          "text": "<analysis prompt>"
        }
      ]
    }
  ]
}
```

## Shell Call

For a local `.mp4`:

```bash
VIDEO_B64="$(base64 -i ./path/video.mp4 | tr -d '\n')"

curl -sS -X POST \
  "https://yunwu.ai/v1beta/models/gemini-2.5-pro:generateContent?key=sk-YnNkhgtXNcmSzTBCvufmxYfzg7oNOtWzDaZjhrgoA8ebdVEQ" \
  -H "Authorization: Bearer sk-YnNkhgtXNcmSzTBCvufmxYfzg7oNOtWzDaZjhrgoA8ebdVEQ" \
  -H "Content-Type: application/json" \
  -d @<(jq -n --arg video "$VIDEO_B64" --arg prompt "$PROMPT" '{
    contents: [{
      role: "user",
      parts: [
        { inline_data: { mime_type: "video/mp4", data: $video } },
        { text: $prompt }
      ]
    }]
  }')
```

If `jq` is unavailable, create the JSON with Python or Node. Do not hand-concatenate huge base64 JSON if avoidable.

## Python Call

```python
import base64
import json
import requests

API_KEY = "sk-YnNkhgtXNcmSzTBCvufmxYfzg7oNOtWzDaZjhrgoA8ebdVEQ"
MODEL = "gemini-3.1-pro-preview"
url = f"https://yunwu.ai/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

with open("./path/video.mp4", "rb") as f:
    video_b64 = base64.b64encode(f.read()).decode("ascii")

payload = {
    "contents": [{
        "role": "user",
        "parts": [
            {"inline_data": {"mime_type": "video/mp4", "data": video_b64}},
            {"text": "请按带货视频拆解框架分析这条视频。"}
        ]
    }]
}

resp = requests.post(
    url,
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json=payload,
    timeout=300,
)
resp.raise_for_status()
print(json.dumps(resp.json(), ensure_ascii=False, indent=2))
```

## Local Video Preparation

If the source is not MP4, or the file is large, create an analysis copy:

```bash
ffmpeg -y -i ./path/input.mov \
  -vf "scale='min(720,iw)':-2" \
  -t 120 \
  -c:v libx264 -preset veryfast -crf 28 \
  -c:a aac -b:a 96k \
  ./path/analysis.mp4
```

Guidelines:

- Prefer MP4/H.264/AAC.
- For long videos, analyze the first 60-120 seconds unless the user asks for full-length analysis.
- If the file is too large, compress to 720p or split into chapters.
- If audio matters, keep audio; if only visuals matter, mute is acceptable.
- For video URLs, download first, then pass local MP4 base64.

## Default Analysis Prompt

Use this prompt for带货视频拆解 unless the user requests a different format:

```text
你是一名资深短视频带货导演、投放优化师和商品转化分析师。请严格基于视频内容进行分析，不要编造看不到的信息。

请用中文输出一份结构化带货视频拆解报告，包含：

1. 一句话总结
- 视频卖什么/疑似卖什么
- 目标人群
- 核心转化承诺

2. 时间轴拆解
- 按 0-3s、3-8s、8-15s、15-30s、30s+ 或实际镜头切分
- 每段说明：画面内容、人物/商品动作、字幕/口播、镜头类型、声音/音乐、转化作用

3. 前 3 秒钩子
- 钩子类型：痛点、好奇、反差、结果展示、身份代入、价格刺激、场景冲突等
- 为什么能/不能留住用户
- 可优化的 3 个开头版本

4. 商品与卖点
- 商品出现次数和出现方式
- 明确卖点、隐含卖点、视觉证明点
- 可信度证据：前后对比、实测、材质、尺寸、细节、场景、第三方背书

5. 脚本结构
- 视频采用的脚本模型：痛点-解决、场景-种草、测评-证明、剧情-反转、清单推荐、直播切片等
- 口播/字幕的核心话术
- CTA 是否明确

6. 视觉语言
- 构图、景别、运镜、剪辑节奏、光线、色彩、字幕设计、商品特写
- 哪些画面最有转化价值
- 哪些画面冗余或影响信任

7. 转化评分
- 停留力 1-10
- 卖点清晰度 1-10
- 信任感 1-10
- 商品展示 1-10
- 下单冲动 1-10
- 总评分和主要扣分原因

8. 可复刻方案
- 复刻脚本大纲
- 需要拍摄的镜头清单
- 可直接使用的口播文案
- 可直接使用的字幕文案
- 适合投放/自然流/直播切片的改造建议

9. 生成模型素材建议
- 如果要用 AI 生图/生视频复刻，请给出 3 条商品图提示词和 3 条视频提示词
- 提示词要适合竖屏带货短视频

最后输出一个 JSON 摘要，字段包括：
product, audience, main_hook, key_selling_points, proof_points, cta, score_total, remake_angle
```

## Compact Prompt

Use this when token cost matters:

```text
请分析这条带货短视频。输出：1一句话总结；2按时间轴拆镜头；3前3秒钩子；4商品卖点和视觉证明；5脚本结构；6镜头/字幕/声音；7转化评分；8可复刻脚本和镜头清单；9改进建议。严格基于视频，不要编造。
```

## JSON Output Prompt

Use this when downstream automation needs structured data:

```text
请严格输出 JSON，不要 Markdown。基于视频内容拆解带货结构：
{
  "summary": "",
  "product": "",
  "audience": "",
  "duration_estimate": "",
  "timeline": [
    {
      "time_range": "",
      "visual": "",
      "speech_or_text": "",
      "camera": "",
      "audio": "",
      "conversion_role": ""
    }
  ],
  "hook": {
    "type": "",
    "description": "",
    "retention_strength": "",
    "improvements": []
  },
  "selling_points": [],
  "proof_points": [],
  "trust_signals": [],
  "cta": "",
  "scores": {
    "retention": 0,
    "clarity": 0,
    "trust": 0,
    "product_display": 0,
    "purchase_impulse": 0,
    "total": 0
  },
  "remake_plan": {
    "script_outline": [],
    "shot_list": [],
    "voiceover": "",
    "subtitles": [],
    "ai_image_prompts": [],
    "ai_video_prompts": []
  }
}
```

## Analysis Method

When analyzing a video:

1. Verify the video file exists or download the URL.
2. Convert/compress to MP4 if needed.
3. Build the Gemini native request with `inline_data`.
4. Use the default analysis prompt unless the user asks for only summary, JSON, or remake prompts.
5. Parse response text from `candidates[].content.parts[].text`.
6. Save raw response JSON when the analysis is important.
7. If the model misses audio/subtitles, rerun with a prompt asking specifically for `口播/字幕逐段提取`.

## Output Standard

For user-facing reports, prefer:

- 中文
- Clear section headers
- Concrete timestamps or approximate segments
- Evidence-based wording: `视频中可见...`, `疑似...`, `未看到...`
- Actionable remake advice, not only description

Avoid:

- Inventing product claims
- Assuming price, brand, sales volume, or conversion data not visible in the video
- Overlong generic marketing theory
- Treating AI-generated videos as real product proof without flagging uncertainty

## Common Tasks

### Full 带货拆解

Use default analysis prompt.

### Extract Copywriting

Ask for:

```text
请重点提取视频里的口播、字幕、屏幕文字和 CTA。按时间轴输出；听不清或看不清的地方标注“无法确认”。
```

### Competitor Analysis

Ask for:

```text
请把这条视频当作竞品带货素材分析：它在卖点、信任、价格锚点、场景、镜头和 CTA 上用了哪些策略？给出我方可借鉴和应避免的点。
```

### Rewrite Into New Script

Ask for:

```text
请基于这条视频的转化结构，改写成一个新的原创带货脚本。保留结构优势，但更换表达、镜头和口播，避免照搬。输出 30 秒竖屏脚本、镜头表、字幕和 CTA。
```

### AI Remake Brief

Ask for:

```text
请把这条带货视频拆成可用 AI 生成复刻素材的 brief：商品图提示词、首帧图提示词、Veo 视频提示词、字幕文案、剪辑节奏和音效建议。
```

## Troubleshooting

- `401/403`: check API key, `Authorization` header, and `key` query parameter.
- `400`: validate JSON shape and ensure `contents[].parts[]` contains `inline_data`.
- No video recognized: confirm `mime_type` is `video/mp4` and base64 has no line breaks.
- Request too large: compress video or analyze shorter clips.
- Response too vague: rerun with the default detailed prompt and ask for timestamps.
- Hallucinated details: add `严格基于视频内容，不要编造看不到的信息`.
- Need exact subtitles: ask the model to focus only on visible字幕 and audible口播.

## Source Links

- Yunwu Apifox video understanding: https://yunwu.apifox.cn/api-309482709
- Google Gemini video understanding docs: https://ai.google.dev/gemini-api/docs/video-understanding?hl=zh-cn
