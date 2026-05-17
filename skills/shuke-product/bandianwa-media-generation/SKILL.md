---
name: bandianwa-media-generation
description: Use this skill to generate images through the Bandianwa (斑点蛙) API. Covers text-to-image and image-to-image generation using gpt-image-2 model, reference image upload via imageproxy, task polling, and result download.
---

# Bandianwa Media Generation

Use this skill when `image_generation.provider` is set to `bandianwa`, or when the user explicitly wants to use the Bandianwa (斑点蛙) service for image generation.

## Required Defaults

Read workspace defaults from:

```text
../config/media_services.yaml
```

Use these config keys unless the user explicitly chooses otherwise:

- Base URL: `bandianwa.base_url` (fixed: `https://api.hellobabygo.com`)
- API key: `bandianwa.api_key`
- Concurrency limit: `bandianwa.concurrency_limit`
- Default image model: `bandianwa.models.image_default`

Do not paste real API keys into prompts, generated files, logs, or user-facing examples.

## API Shape

Bandianwa uses an **async generation** pattern with separate submit, poll, and download endpoints:

```text
POST /v1/images/generations?async=true   (submit generation task)
GET  /v1/images/{task_id}                (poll task status)
GET  /v1/images/{task_id}/content         (download generated image)
```

Authentication:

```text
Authorization: Bearer <bandianwa.api_key>
```

The submit endpoint returns a `task_id` immediately. Poll until status reaches `completed` or `failed`, then download the image content.

### Supported Parameters (POST body)

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | Model name (required). Default: `gpt-image-2` |
| `prompt` | string | Generation prompt (required) |
| `response_format` | string | Output format, always use `"url"` |
| `size` | string | Image size, e.g. `"1024x1024"` |
| `urls` | array of strings | Publicly accessible reference image URLs for image-to-image (optional) |

### Size ↔ Aspect Ratio Mapping

| Aspect Ratio | Size |
|-------------|------|
| `"1:1"` | `"1024x1024"` |
| `"16:9"` | `"1792x1024"` |
| `"9:16"` | `"1024x1792"` |
| `"4:3"` | `"1280x960"` |
| `"3:4"` | `"960x1280"` |

Use `"9:16"` → `"1024x1792"` for ecommerce storyboard first-frame images. If a size is unsupported by the API, fall back to `"1024x1024"` and record the fallback in `references.json`.

## Model Selection

| Model | Description |
|-------|-------------|
| `gpt-image-2` | Bandianwa GPT Image 2 (default) |

Use the configured default from `media_services.yaml` unless the user explicitly overrides the model.

## Text-To-Image

Submit a text-to-image generation task:

```bash
curl -X POST "$BANDIANWA_BASE_URL/v1/images/generations?async=true" \
  -H "Authorization: Bearer $BANDIANWA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "A 9:16 vertical ecommerce product image...",
    "response_format": "url",
    "size": "1024x1792"
  }'
```

Expected submit response (task_id is returned; poll for result):

```json
{
  "id": "task_abc123",
  "status": "queued"
}
```

## Image-To-Image (With Reference Images)

Bandianwa's API requires reference images to be **publicly accessible URLs**. Local images must be uploaded to an external image hosting service first.

### Reference Image Upload (Base64 → Public URL)

If reference images are local files or base64-encoded (no public URL), upload them to the imageproxy service first:

```bash
# Upload a local image file to imageproxy
UPLOAD_RESPONSE=$(curl -s -X POST "https://imageproxy.zhongzhuan.chat/api/upload" \
  -F "file=@./reference_image.png")

# Extract the public URL from the response
REF_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.url')
```

Expected upload response:

```json
{
  "url": "https://imageproxy.zhongzhuan.chat/xxx/reference_image.png"
}
```

If the reference image already has a public URL, skip the upload step and use the URL directly.

### Submit Image-to-Image Task

Once all reference images have public URLs, submit the generation task with the `urls` array:

```bash
curl -X POST "$BANDIANWA_BASE_URL/v1/images/generations?async=true" \
  -H "Authorization: Bearer $BANDIANWA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "Transform this product into a lifestyle scene...",
    "response_format": "url",
    "size": "1024x1792",
    "urls": [
      "https://imageproxy.zhongzhuan.chat/xxx/ref1.png",
      "https://imageproxy.zhongzhuan.chat/xxx/ref2.png"
    ]
  }'
```

### Full Image-To-Image Flow

```bash
# 1. For each local reference image, compress then upload
for img in ./product_reference_board.png ./character_reference_sheet.png ./scene_reference_board.png; do
  # Compress first (optional but recommended)
  python3 ../chaowenai-media-generation/compress_image.py "$img"
  # Determine which file to upload (compressed or original)
  if [ -f "${img%.*}_compressed.webp" ]; then
    UPLOAD_FILE="${img%.*}_compressed.webp"
  else
    UPLOAD_FILE="$img"
  fi
  # Upload to imageproxy
  REF_URL=$(curl -s -X POST "https://imageproxy.zhongzhuan.chat/api/upload" \
    -F "file=@$UPLOAD_FILE" | jq -r '.url')
  REF_URLS+=("$REF_URL")
done

# 2. Build the JSON body with the urls array
BODY=$(jq -n \
  --arg model "gpt-image-2" \
  --arg prompt "Create a vertical 9:16 photorealistic first frame..." \
  --arg size "1024x1792" \
  --argjson urls "$(printf '%s\n' "${REF_URLS[@]}" | jq -R . | jq -s .)" \
  '{model: $model, prompt: $prompt, response_format: "url", size: $size, urls: $urls}')

# 3. Submit the generation task
curl -X POST "$BANDIANWA_BASE_URL/v1/images/generations?async=true" \
  -H "Authorization: Bearer $BANDIANWA_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

## Polling

After submit, poll every 10-15 seconds:

```bash
curl -s -X GET "$BANDIANWA_BASE_URL/v1/images/$TASK_ID" \
  -H "Authorization: Bearer $BANDIANWA_API_KEY"
```

Status response (completed):

```json
{
  "id": "task_abc123",
  "status": "completed",
  "data": [
    {
      "url": "https://cdn.bandianwa.com/results/xxx.png"
    }
  ]
}
```

Read the result URL from `data[0].url`.

Statuses:
- `queued` / `processing`: wait and retry.
- `completed`: extract `data[0].url`, then download.
- `failed`: stop and record the error.

## Download

Once the task is completed, download the generated image:

```bash
curl -o ./generated_media/shot_01_first_frame.png \
  "$BANDIANWA_BASE_URL/v1/images/$TASK_ID/content" \
  -H "Authorization: Bearer $BANDIANWA_API_KEY"
```

The `/content` endpoint returns raw image bytes. Save directly to the project folder.

Alternatively, if the poll response includes a CDN URL in `data[0].url`, you can download from that URL directly (no auth header needed for CDN URLs).

## Concurrency

Read `bandianwa.concurrency_limit` from config. For batch generation, do not submit more than that many tasks at once. Queue remaining jobs when the concurrency pool is full.

Image-to-image tasks with reference uploads: upload all reference images first (uploads can be parallel), then submit generation tasks within the concurrency limit.

## Product Workflow Integration

When this provider is active:

- `image_generation.provider: "bandianwa"` means generated product reference boards, character sheets, scene boards, and storyboard first-frame images use this skill.
- **Reference images must be public URLs** — upload local images to `https://imageproxy.zhongzhuan.chat/api/upload` before including them as `urls` in the generation request.
- For image-to-image generation with foundation references, upload `product_reference_board.png`, `character_reference_sheet.png`, and `scene_reference_board.png` to imageproxy first, then include their public URLs in the `urls` array.
- For text-to-image (no reference images), omit the `urls` field entirely.
- Save downloaded media under `generated_media/shot_XX_first_frame.png`.
- Save provider metadata in `references.json`: provider `bandianwa`, model `gpt-image-2`, task_id, status, imageproxy upload URLs, generated image URL, downloaded path, timestamps.
- Compression before upload is recommended — use `../chaowenai-media-generation/compress_image.py` to compress local images before uploading to imageproxy.

## Troubleshooting

- `401`: missing or invalid API key (`bandianwa.api_key`).
- `400`: invalid model, malformed JSON, or unsupported `size` value. Try falling back to `"1024x1024"`.
- `503` with `model_not_found`: the configured model is temporarily unavailable. Retry with the same model after 30s.
- Reference image upload failure: verify the imageproxy service is reachable. If imageproxy is down, reference images cannot be included (fall back to text-to-image without `urls`).
- `task_id` not returned: check that `?async=true` query parameter is present in the submit URL.
- Polling returns empty `data` array: the task may still be processing. Wait and retry.
- Download returns 404: the task may not be completed yet, or the result may have expired. Poll again to confirm status.
- If a reference image already has a public URL, use it directly — do not re-upload to imageproxy.
