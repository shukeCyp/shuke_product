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
- API key: `chaowenai.api_key`
- Concurrency limit: `chaowenai.concurrency_limit`
- Text-to-image / image-to-image default model: `chaowenai.models.image_default`
- Text-to-video default model: `chaowenai.models.text_to_video_default`
- Image-to-video / first-last-frame default model: `chaowenai.models.image_to_video_default`
- Reference-to-video default model: `chaowenai.models.multi_reference_video_default`

Do not paste real API keys into prompts, generated files, logs, or user-facing examples.

## API Shape

ChaowenAI uses a **unified async generation endpoint** for both images and videos:

```text
POST /v1/videos       (submit generation task)
GET  /v1/videos/{id}  (poll task status, with ?model=...)
```

Authentication:

```text
Authorization: Bearer <api_key>
```

Images and videos share the same task queue. The submit endpoint returns a `task_id` immediately. Poll until status reaches `completed` or `failed`.

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
  -H "Authorization: Bearer $CHAOWENAI_KEY" \\
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
  -H "Authorization: Bearer $CHAOWENAI_KEY" \\
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
  -H "Authorization: Bearer $CHAOWENAI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "veo3.1-fast",
    "prompt": "Vertical 9:16 handheld real-shot UGC video...",
    "aspectRatio": "9:16"
  }'
```

## Image-To-Video (First Frame)

Provide a single starting frame via URL or base64:

```bash
# Using URL
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "veo3.1-fast",
    "prompt": "Animate this product image...",
    "aspectRatio": "9:16",
    "firstFrameUrl": "https://example.com/first_frame.png"
  }'

# Using local file (base64)
IMG_B64="$(base64 -i ./first_frame.png | tr -d '\\n')"
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "veo3.1-fast",
    "prompt": "Animate this product image...",
    "aspectRatio": "9:16",
    "firstFrameBase64": "data:image/png;base64,..."
  }'
```

## First/Last-Frame Video

Provide both a start frame and an end frame:

```bash
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_KEY" \\
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

Use reference images to guide style, product appearance, and scene:

```bash
curl -X POST "$CHAOWENAI_BASE_URL/v1/videos" \\
  -H "Authorization: Bearer $CHAOWENAI_KEY" \\
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
  -H "Authorization: Bearer $CHAOWENAI_KEY"
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
- Save downloaded media under `generated_media/shot_XX_first_frame.png` or `generated_media/shot_XX_video.mp4`.
- Save provider metadata in `references.json`: provider `chaowenai`, model, task_id, status, file url, downloaded path, timestamps.

## Troubleshooting

- `401`: missing or invalid API key.
- `400`: invalid model, malformed JSON, or image file problem.
- The submit and polling endpoints both use `/v1/videos`; POST to submit, GET to poll.
- If `task_id` is missing, check model name or required parameters.
- Video and image generation share the same task queue.
- For local image inputs, always convert to base64 data URLs with the correct MIME type.
