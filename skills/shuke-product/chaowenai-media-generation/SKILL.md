---
name: chaowenai-media-generation
description: Use this skill to generate images and videos through the ChaowenAI (超稳AI) API at api.chaowenai.com. Covers text-to-image, image-to-image, text-to-video, image-to-video (first frame), first/last-frame video, reference-image-to-video, task polling, and result download. Both image and video use a unified /v1/videos endpoint with OpenAI-compatible auth.
---

# ChaowenAI Media Generation

Use this skill when `image_generation.provider` or `video_generation.provider` is set to `chaowenai`, or when the user explicitly wants to use the ChaowenAI (超稳AI) service at api.chaowenai.com.

## Required Defaults

Read workspace defaults from:

```text
../config/media_services.yaml
```

Use these config keys unless the user explicitly chooses otherwise:

- Base URL: `chaowenai.base_url`
- Image API key: `chaowenai.api_key_image`
- Video API key: `chaowenai.api_key_video`
- Concurrency limit: `chaowenai.concurrency_limit`
- Text-to-image / image-to-image default model: `chaowenai.models.image_default`
- Text-to-video default model: `chaowenai.models.text_to_video_default`
- Image-to-video / first-last-frame default model: `chaowenai.models.image_to_video_default`
- Reference-to-video default model: `chaowenai.models.multi_reference_video_default`

Do not paste real API keys into prompts, generated files, logs, or user-facing examples.

> **Dual-Key Setup**: Use `chaowenai.api_key_image` for image generation tasks and `chaowenai.api_key_video` for video generation tasks. They belong to different model groups.

## API Shape

ChaowenAI uses a **unified async generation endpoint** for both images and videos:

```text
POST /v1/videos       (submit generation task)
GET  /v1/videos/{id}  (poll task status, with ?model=...)
```

Authentication (two keys):

```text
# Image generation
Authorization: Bearer <api_key_image>

# Video generation  
Authorization: Bearer <api_key_video>
```

Images and videos share the same task queue but use different API keys. The submit endpoint returns a `task_id` immediately. Poll until status reaches `completed` or `failed`.

### Supported Parameters

All generation types share these common parameters in the POST body:

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | Model name (required) |
| `prompt` | string | Generation prompt (required) |
| `aspectRatio` | string | `"16:9"` or `"9:16"` (videos); images use `aspect_ratio` |
| `aspect_ratio` | string | For images: `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`, `"auto"` |
| `imageSize` | string | For images: `"1K"`, `"2K"`, `"4K"` |
| `firstFrameUrl` | string | Remote URL for first-frame image (video I2V) |
| `firstFrameBase64` | string | Base64 data URL for first-frame image (video I2V) |
| `lastFrameUrl` | string | Remote URL for last-frame image (first/last-frame) |
| `lastFrameBase64` | string | Base64 data URL for last-frame image (first/last-frame) |
| `referenceImagesBase64` | array | Array of base64 data URLs for reference-to-video (up to 3) |

## Model Selection

### Video Models

| Model | Description |
|-------|-------------|
| `veo3.1-fast` | Fast Veo 3.1 video generation (default for video) |
| `veo3.1-lite` | Lighter Veo 3.1 video generation |

### Image Models

| Model | Description |
|-------|-------------|
| `nano-banana-2` | Nano Banana 2 (default for images) |
| `nano-banana-pro` | Nano Banana Pro |
| `gemini-3.1-flash-image` | Gemini 3.1 Flash for images |
| `gemini-3.0-pro-image` | Gemini 3.0 Pro for images |

Use the configured defaults from `media_services.yaml` unless the user explicitly overrides the model.

## Text-To-Image

Submit a text-to-image generation task:

```bash
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_IMG_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nano-banana-2",
    "prompt": "A 9:16 vertical ecommerce product image...",
    "aspect_ratio": "9:16",
    "imageSize": "1K"
  }'
```

Expected submit response:

```json
{
  "id": "abc123def456",
  "status": "queued"
}
```

## Image-To-Image

Submit with one or more reference images (local files as base64 data URLs):

```bash
IMG_B64="$(base64 -i ./product1.jpg | tr -d '\\n')"
DATA_URL="data:image/jpeg;base64,$IMG_B64"

curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_IMG_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nano-banana-2",
    "prompt": "Transform this product into a lifestyle scene...",
    "aspect_ratio": "9:16",
    "imageSize": "1K",
    "imageFilesBase64": ["data:image/jpeg;base64,..."]
  }'
```

## Text-To-Video

```bash
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_VID_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "veo3.1-fast",
    "prompt": "Vertical 9:16 handheld real-shot UGC video...",
    "aspectRatio": "9:16"
  }'
```

## Image-To-Video (First Frame)

Provide a single starting frame via URL or base64. **Local images must be compressed first** (see Image Compression section above).

```bash
# Using URL
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_VID_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "veo3.1-fast",
    "prompt": "Animate this product image...",
    "aspectRatio": "9:16",
    "firstFrameUrl": "https://example.com/first_frame.png"
  }'

# Using local file (base64) — with compression
python3 ./compress_image.py ./first_frame.png
# If COMPRESSED: use the output path; otherwise use original
IMG_PATH="./first_frame.png"  # or the compressed path
IMG_B64="$(base64 -i "$IMG_PATH" | tr -d '\\n')"
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_VID_KEY" \\
  -H "Content-Type: application/json" \\
  -d "$(cat <<EOF
{
  "model": "veo3.1-fast",
  "prompt": "Animate this product image...",
  "aspectRatio": "9:16",
  "firstFrameBase64": "data:image/webp;base64,${IMG_B64}"
}
EOF
)"
```

## First/Last-Frame Video

Provide both a start frame and an end frame. **Local images must be compressed first.**

```bash
# Compress both frames first
python3 ./compress_image.py ./start.png
python3 ./compress_image.py ./end.png

curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_VID_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "veo3.1-fast",
    "prompt": "Create a seamless transition from start to end...",
    "aspectRatio": "9:16",
    "firstFrameUrl": "https://example.com/start.png",
    "lastFrameUrl": "https://example.com/end.png"
  }'
```

## Reference-To-Video (Up to 3 Images)

Use reference images to guide style, product appearance, and scene. **All reference images must be compressed first.**

```bash
# Compress all reference images
for img in ./ref1.jpg ./ref2.jpg ./ref3.jpg; do
  python3 ./compress_image.py "$img"
done

curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_VID_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "veo3.1-lite",
    "prompt": "Use these references to generate a product demo video...",
    "aspectRatio": "9:16",
    "referenceImagesBase64": ["data:image/jpeg;base64,..."]
  }'
```

## Polling

After submit, poll every 10-15 seconds:

```bash
curl -X GET "$CHAOWENAI_BASE_URL/v1/videos/$TASK_ID?model=veo3.1-fast" \\
  -H "Authorization: Bearer $CHAOWENAI_IMG_KEY"
```

Status response:

```json
{
  "id": "abc123def456",
  "status": "completed",
  "video_url": "https://api.chaowenai.com/v1/files/xxx.mp4",
  "image_url": "https://api.chaowenai.com/v1/files/xxx.jpg"
}
```

Statuses:
- `queued` / `processing`: wait and retry.
- `completed`: extract `video_url` (video) or `image_url` (image).
- `failed`: stop and record the error.

When `status` is `completed`, download the file immediately into the product project folder.

## Concurrency

Read `chaowenai.concurrency_limit` from config. For batch generation, do not submit more than that many tasks at once.

## Image Compression (Pre-Upload)

**重要：在将本地图片转为 base64 发送给 API 之前，必须先运行压缩脚本。** 这能显著减少传输大小、降低超时风险、提升 API 响应速度。

压缩脚本位置（相对于本 SKILL.md）：

```text
./compress_image.py
```

### 压缩策略

脚本自动选择最优压缩策略，遵循"无损优先，高质量有损兜底"原则：

| 原格式 | 策略顺序 |
|--------|----------|
| PNG | 无损PNG优化 → 无损WebP |
| WebP | 无损WebP |
| GIF | 无损GIF优化 → 无损WebP |
| JPEG | 高质量JPEG优化(q=95, subsampling=0) |
| 有透明通道 | WebP(q=95→90→85→80) |
| 无透明通道 | JPEG(q=95→90→85→80) → WebP(q=95→90→85) |
| 其他 | 无损WebP |

- 图片 ≤ 1MB 不触发压缩，直接使用原图。
- 如果所有策略压缩后都比原图大，回退原图（收益不足）。
- 压缩阈值可通过第二个参数调整（默认 1048576 字节）。

### 用法

```bash
# 压缩单张图片（默认 1MB 阈值）
python3 ./compress_image.py ./first_frame.png

# 自定义阈值（例如 512KB）
python3 ./compress_image.py ./product.jpg 524288
```

输出示例：
```
COMPRESSED:./first_frame_compressed.webp|2097152|491520|无损WebP
SKIPPED:./small_icon.png|51200|未触发(低于阈值)
```

### 在视频生成流程中使用

对于需要传图的视频生成模式（首帧图生视频、首尾帧图生视频、参考图生视频），流程为：

```bash
# 1. 先压缩图片
RESULT=$(python3 ./compress_image.py ./first_frame.png)
# 2. 提取压缩后的路径和 MIME
if echo "$RESULT" | grep -q "^COMPRESSED:"; then
    IMG_PATH=$(echo "$RESULT" | cut -d'|' -f1 | sed 's/COMPRESSED://')
else
    IMG_PATH="./first_frame.png"  # 未被压缩，用原图
fi
# 3. 根据扩展名推断 MIME，生成 base64 data URL
case "$IMG_PATH" in
    *.webp) MIME="image/webp" ;;
    *.jpg|*.jpeg) MIME="image/jpeg" ;;
    *.png) MIME="image/png" ;;
    *.gif) MIME="image/gif" ;;
    *) MIME="image/png" ;;
esac
DATA_URL="data:${MIME};base64,$(base64 -i "$IMG_PATH" | tr -d '\n')"
# 4. 发送 API 请求
```

## Base64 Image Input Helper

```bash
# JPEG
DATA_URL="data:image/jpeg;base64,$(base64 -i ./image.jpg | tr -d '\\n')"
# PNG
DATA_URL="data:image/png;base64,$(base64 -i ./image.png | tr -d '\\n')"
# WebP
DATA_URL="data:image/webp;base64,$(base64 -i ./image.webp | tr -d '\\n')"
```

## Product Workflow Integration

When this provider is active:

- `image_generation.provider: "chaowenai"` means generated product reference boards, character sheets, scene boards, and storyboard first-frame images use this skill.
- `video_generation.provider: "chaowenai"` means generated storyboard videos use this skill.
- **Before any video generation with local image inputs, run `python3 ./compress_image.py <image_path>` on every input image.** This applies to image-to-video, first/last-frame video, and reference-to-video modes.
- Save downloaded media under `generated_media/shot_XX_first_frame.png` or `generated_media/shot_XX_video.mp4`.
- Save provider metadata in `references.json`: provider `chaowenai`, model, task_id, status, file url, downloaded path, compression info, timestamps.

## Troubleshooting

- `401`: missing or invalid API key.
- `400`: invalid model, malformed JSON, or image file problem.
- `503` with `model_not_found`: the configured default model is temporarily unavailable. Try alternative models in order: `nano-banana-pro`, `gemini-3.1-flash-image`, `gemini-3.0-pro-image`. Do not switch providers just because one model fails — fall back within ChaowenAI's model list first, and record the fallback in references.json.
- The submit and polling endpoints both use `/v1/videos`; POST to submit, GET to poll.
- If `task_id` is missing, check model name or required parameters.
- Video and image generation share the same task queue.
- For local image inputs, always convert to base64 data URLs with the correct MIME type.

### Polling Timeouts and Batch Handling

Video generation (veo3.1-fast) typically takes 2-5+ minutes per job from submission to completion. When generating a batch of 8+ videos:

- Total batch time can exceed 300s (common sandbox/script timeout).
- Submit all tasks at once — ChaowenAI queues them server-side. Submitting more than `concurrency_limit` tasks is fine; the limit controls how many tasks you actively poll, not how many you submit.
- If your polling script times out mid-batch, re-submit only the missing shots by their first-frame images. The original tasks may still complete on the server, but you won't have their task IDs. Re-submission with the same first frame is the safest recovery.
- For long-running batch jobs, consider splitting into rounds of 3-4 shots and tracking task IDs persistently (e.g., save to a JSON file) so you can resume polling without re-submission.
