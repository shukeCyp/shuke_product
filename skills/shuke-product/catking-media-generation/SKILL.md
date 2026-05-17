---
name: catking-media-generation
description: Use this skill to generate Veo videos through the CatKing API at api.catking.top. Covers text-to-video, reference-image-to-video, task polling, and result download.
---

# CatKing Media Generation

Use this skill when `video_generation.provider` is set to `catking`, or when the user explicitly wants to use the CatKing service for video generation.

## Required Defaults

Read workspace defaults from:

```text
../config/media_services.yaml
```

Use these config keys unless the user explicitly chooses otherwise:

- Base URL: `catking.base_url` (fixed: `https://api.catking.top`)
- API key: `catking.api_key`
- Concurrency limit: `catking.concurrency_limit`
- Text-to-video default model: `catking.models.text_to_video_default`
- Reference-to-video default model: `catking.models.reference_to_video_default`

Do not paste real API keys into prompts, generated files, logs, or user-facing examples.

## API Shape

CatKing uses an **async generation** pattern with submit and poll endpoints:

```text
POST /v1/videos       (submit generation task)
GET  /v1/videos/{id}  (poll task status)
```

Authentication:

```text
Authorization: Bearer <catking.api_key>
```

The submit endpoint returns a `task_id` immediately. Poll until status reaches `completed` or `failed`, then download the video from the returned `url`.

### Supported Parameters (POST body)

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | Model name (required) |
| `prompt` | string | Generation prompt (required) |
| `reference_images` | array of strings | Base64-encoded reference images for image-to-video / reference-to-video (optional, up to 3) |

Omit `reference_images` for text-to-video. Include it for image-to-video or reference-to-video.

## Model Selection

| Model | Description |
|-------|-------------|
| `ali-veo-3.1-portrait-8s-1080p` | Veo 3.1 portrait (9:16 vertical) 8s 1080p (default for portrait) |
| `ali-veo-3.1-landscape-8s-1080p` | Veo 3.1 landscape (16:9 horizontal) 8s 1080p |

Use `ali-veo-3.1-portrait-8s-1080p` as the default for ecommerce/product workflows. Only use `ali-veo-3.1-landscape-8s-1080p` when the user explicitly asks for landscape/horizontal video.

## Text-To-Video

Submit a text-to-video generation task (omit `reference_images`):

```bash
curl -X POST "$CATKING_BASE_URL/v1/videos" \
  -H "Authorization: Bearer $CATKING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ali-veo-3.1-portrait-8s-1080p",
    "prompt": "Vertical 9:16 handheld real-shot UGC video of a young woman opening a compact travel organizer on a hotel desk. One smooth natural motion, practical room light, slight phone-camera movement. Format: 8 seconds. Audio: room tone and subtle handling sound, no subtitles."
  }'
```

Expected submit response:

```json
{
  "id": "d0dfdf90-5db8-422c-a14e-fb0eb9e5f245",
  "object": "video",
  "model": "ali-veo-3.1-portrait-8s-1080p",
  "status": "processing",
  "progress": 0,
  "created_at": 1777513551
}
```

## Reference-Image-To-Video

Submit with reference images (base64 data URLs). CatKing supports up to 3 reference images in the `reference_images` array:

```bash
IMG1_B64="$(base64 -i ./first_frame.png | tr -d '\n')"
IMG2_B64="$(base64 -i ./ref2.png | tr -d '\n')"

curl -X POST "$CATKING_BASE_URL/v1/videos" \
  -H "Authorization: Bearer $CATKING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ali-veo-3.1-portrait-8s-1080p",
    "prompt": "Animate this product image as vertical 9:16 real-shot UGC video. Use natural handheld camera movement and practical room light. Preserve product shape, logo, label, scale, and composition. Format: 8 seconds. Audio: subtle room tone and soft product handling sound, no subtitles.",
    "reference_images": [
      "data:image/png;base64,'"$IMG1_B64"'",
      "data:image/png;base64,'"$IMG2_B64"'"
    ]
  }'
```

### Reference Image Roles

Assign each reference image a clear role in the prompt:

- Reference 1: primary identity anchor — product reference board or character reference sheet
- Reference 2: scene/environment context
- Reference 3: secondary style, color grade, or detail guidance

For image-to-video using a single first frame, include just one base64 string in `reference_images`. For first/last-frame video, include two images and describe the transition in the prompt. For reference-guided video, include up to 3 images.

### Reference Image Preparation

Before encoding local images to base64:

- Compress large images first to reduce transfer size.
- The `chaowenai-media-generation` compress_image.py script can be reused:

```bash
python3 ../chaowenai-media-generation/compress_image.py ./first_frame.png
```

## Polling

After submit, poll every 5-10 seconds:

```bash
curl -s -X GET "$CATKING_BASE_URL/v1/videos/$TASK_ID" \
  -H "Authorization: Bearer $CATKING_API_KEY"
```

Status response (completed):

```json
{
  "id": "1c5f3045-a852-4133-b4cb-271a1da88f49",
  "url": "https://cdn.catking.top/results/xxx.mp4",
  "model": "ali-veo-3.1-portrait-8s-1080p",
  "object": "video",
  "status": "completed",
  "progress": 100,
  "created_at": 1777449180,
  "completed_at": 1777449403
}
```

Statuses:
- `processing`: wait and retry.
- `completed`: extract `url`, then download.
- `failed`: stop and record the error.

When `status` is `completed`, download the video from `url`:

```bash
curl -L "$VIDEO_URL" -o ./generated_media/shot_01_video.mp4
```

## Concurrency

Read `catking.concurrency_limit` from config. For batch generation, do not submit more than that many tasks at once. Queue remaining jobs when the concurrency pool is full.

## Product Workflow Integration

When this provider is active:

- `video_generation.provider: "catking"` means generated storyboard videos use this skill.
- Keep first-frame image generation controlled by `image_generation.provider`.
- **Before video generation with local image inputs, compress images first** using `../chaowenai-media-generation/compress_image.py`.
- Save downloaded media under `generated_media/shot_XX_video.mp4`.
- Save provider metadata in `references.json`: provider `catking`, model, task_id, status, video url, downloaded path, timestamps.
- Use `veo31-video-prompting` for prompt craft, then submit the resulting prompt through this CatKing API.

## Batch Video Generation Pattern

When generating videos for a multi-shot storyboard:

1. Submit all tasks in order (they queue server-side)
2. Poll all tasks with concurrency = `catking.concurrency_limit` from config
3. For failed tasks, modify the prompt and resubmit
4. Download each completed result immediately
5. Record task_id and result metadata for each shot

## Troubleshooting

- `401`: missing or invalid API key (`catking.api_key`).
- `400`: invalid model, malformed JSON, or base64 encoding problem.
- `429`: rate limit reached; wait and retry later.
- `503`: service busy; retry after 30s.
- Task stuck on `processing`: check polling timeout. Video generation typically takes 2-5+ minutes. If no progress after 10 minutes, consider the task stalled and resubmit.
- Reference image too large: compress images before base64 encoding. Use `../chaowenai-media-generation/compress_image.py`.
- Download URL expired: download videos immediately after the task completes. URLs may have limited TTL.
