---
name: cloudy-veo-generation
description: Use this skill to generate Veo videos through the Cloudy / W Project HOLO API. Covers VEO 3.1 Fast text-to-video, image-to-video, first/last-frame video, reference-to-video, task polling, result download, and workspace config defaults.
---

# Cloudy VEO Generation

Use this skill when the user wants video generation through Cloudy / W Project HOLO API, especially when `video_generation.provider` is `cloudy_veo`.

## Required Defaults

Read workspace defaults from:

```text
../config/media_services.yaml
```

Use these config keys unless the user explicitly chooses otherwise:

- Base URL: `cloudy_veo.base_url`
- API key: `cloudy_veo.api_key`
- Concurrency limit: `cloudy_veo.concurrency_limit`
- Text-to-video default model: `cloudy_veo.models.text_to_video_default`
- Image-to-video / first-last-frame default model: `cloudy_veo.models.image_to_video_default`
- Multi-reference video default model: `cloudy_veo.models.multi_reference_video_default`

Do not paste real API keys into prompts, generated files, logs, or user-facing examples. If `cloudy_veo.api_key` is missing or still a placeholder, stop before generation and tell the user the config needs a valid key.

## API Shape

Cloudy uses one async generation endpoint for images and videos:

```text
POST /v1/generate
GET /v1/tasks/{task_id}
GET /v1/tasks/{task_id}/file
GET /me
```

**Important: the submit endpoint returns HTTP 202 Accepted, not 200 OK**, on success. The response body contains the `task_id`. Treat any 2xx as a successful submission; do not reject 202 responses.

Authentication supports either:

```text
Authorization: Bearer <api_key>
X-API-Key: <api_key>
```

Prefer `Authorization: Bearer <api_key>` for consistency with the workspace's other media services.

## Model Selection

This workspace uses VEO 3.1 Fast by default:

- Text-to-video portrait: `veo_3_1_t2v_fast_portrait`
- Text-to-video landscape: `veo_3_1_t2v_fast_landscape`
- Image-to-video portrait: `veo_3_1_i2v_fast_portrait`
- Image-to-video landscape: `veo_3_1_i2v_fast_landscape`
- Reference-to-video portrait: `veo_3_1_r2v_fast_portrait`
- Reference-to-video landscape: `veo_3_1_r2v_fast_landscape`

Use the configured portrait defaults for ecommerce/product workflows unless the user asks for landscape, 1080p, 4K, Lite, Quality, 4-second, or 6-second variants.

Important behavior:

- T2V sends only text content.
- I2V sends 1 image plus text. One image is the starting frame.
- First/last-frame video sends 2 images plus text to an I2V model. The first image is the starting frame and the second image is the ending frame; no special model name is needed.
- R2V sends up to 3 images plus text to an R2V model as style/reference guidance, not start/end frames.
- URL and base64 image inputs are both supported. Use data URLs for local files: `data:image/jpeg;base64,...`, `data:image/png;base64,...`, or `data:image/webp;base64,...`.
- Default video planning in this workspace is vertical 9:16. If duration is not specified, write `Format: 8 seconds` in the prompt and use the configured 8-second Fast model.

## Submit Text-To-Video

```bash
curl -X POST "$CLOUDY_VEO_BASE_URL/v1/generate" \
  -H "Authorization: Bearer $CLOUDY_VEO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo_3_1_t2v_fast_portrait",
    "messages": [
      {
        "role": "user",
        "content": "Vertical 9:16 handheld real-shot UGC video of a compact product being demonstrated on a bathroom counter. One clear natural action, practical room light, slight phone-camera movement, realistic scale. Format: 8 seconds. Audio: room tone and subtle handling sound, no subtitles."
      }
    ]
  }'
```

Expected submit response:

```json
{
  "task_id": "abc123def456",
  "status": "queued",
  "position": 12,
  "cost": 12,
  "model": "veo_3_1_t2v_fast_portrait",
  "created_at": "2026-03-26T12:00:00+00:00"
}
```

## Submit Image-To-Video

```bash
curl -X POST "$CLOUDY_VEO_BASE_URL/v1/generate" \
  -H "Authorization: Bearer $CLOUDY_VEO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo_3_1_i2v_fast_portrait",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,<first_frame_base64>"
            }
          },
          {
            "type": "text",
            "text": "Animate this first frame as vertical 9:16 real-shot UGC phone footage. Preserve product shape, logo, label, person identity, lighting, and composition. Use one smooth natural motion. Format: 8 seconds. Audio: subtle room tone, no subtitles."
          }
        ]
      }
    ]
  }'
```

## Submit First/Last-Frame Video

Use the same configured I2V model and send exactly 2 images:

```json
{
  "model": "veo_3_1_i2v_fast_portrait",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,<start_frame_base64>"}},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,<end_frame_base64>"}},
        {"type": "text", "text": "Create a smooth physical transition from the first frame to the last frame. Preserve camera angle, product identity, room, lighting, and hand anatomy. Format: 8 seconds. Audio: natural handling sound, no subtitles."}
      ]
    }
  ]
}
```

## Submit Reference-To-Video

Use only when references should guide style, product, character, or scene rather than define start/end frames. Send up to 3 images:

```json
{
  "model": "veo_3_1_r2v_fast_portrait",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,<product_reference>"}},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,<character_reference>"}},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,<scene_reference>"}},
        {"type": "text", "text": "Generate vertical 9:16 real-shot UGC product footage using these references for product, person, and scene consistency. One clear natural action. Format: 8 seconds. Audio: room tone, no subtitles."}
      ]
    }
  ]
}
```

## Poll And Download

After submit, poll every 5-10 seconds:

```bash
curl -X GET "$CLOUDY_VEO_BASE_URL/v1/tasks/$TASK_ID" \
  -H "Authorization: Bearer $CLOUDY_VEO_API_KEY"
```

Statuses:

- `queued`: wait; optional `position` may show queue position.
- `processing`: wait.
- `completed`: download `result.file_url`.
- `failed`: stop and record `error`; failed tasks are refunded by the service. The error object may contain `{"code": "content_policy_violation", "message": "..."}` or other codes.
- `cancelled`: stop and record cancellation.

**Polling resilience**: The polling endpoint may intermittently return SSL errors (e.g. `[SSL: UNEXPECTED_EOF_WHILE_READING]`). These are transient — retry the poll request with exponential backoff rather than treating the task as failed.

**Cost info**: The submit response and poll responses include a `cost` field showing credits consumed (e.g. `"cost": 49`). Record this in metadata for accounting.

When `status` is `completed`, download the file:

```bash
curl -L "$CLOUDY_VEO_BASE_URL/v1/tasks/$TASK_ID/file" \
  -H "Authorization: Bearer $CLOUDY_VEO_API_KEY" \
  -o shot_01_video.mp4
```

If `result.file_url` is a relative path, prefix it with `cloudy_veo.base_url`. Generated files are retained for 48 hours, so copy/download final videos into the product project folder immediately.

## Concurrency

Read `cloudy_veo.concurrency_limit` from config. For batch video generation, do not submit more than that many Cloudy tasks at once. Queue remaining shots until a task reaches a terminal status.

## Product Workflow Integration

When this provider is active:

- `video_generation.provider: "cloudy_veo"` means generated storyboard videos should use this skill.
- Keep first-frame image generation controlled by `image_generation.provider`.
- Save downloaded videos under the active product project `generated_media/shot_XX_video.mp4`.
- Save provider metadata in `references.json`: provider `cloudy_veo`, model, task_id, status, cost if present, file_url, downloaded path, started/completed timestamps if present, and any error.
- Use `veo31-video-prompting` for prompt craft, then submit the resulting prompt through this Cloudy API.

## Troubleshooting

- `401`: missing or invalid API key.
- `400`: invalid model, malformed JSON, or image download/base64 problem.
- `402`: insufficient credits.
- `429`: rate limit or daily limit reached; wait and retry later.
- `503`: generators busy or service paused; check `/health` and retry later.
- I2V with 2 images creates first/last-frame mode automatically; use R2V only for reference-style guidance.
- If the task completes but the file URL is relative, download from `cloudy_veo.base_url + result.file_url`.
- **`content_policy_violation`**: The prompt or image triggered a safety filter. Common triggers: close-up of liquid/skin contact, medical/health claims, skin conditions appearing too prominently. Retry with a more conservative prompt — reduce emphasis on liquid texture, avoid before/after skin condition claims in the video prompt itself (keep those in the VO/script only), and avoid extreme close-ups of skin pores or blemishes.
- **SSL errors during polling**: Intermittent SSL EOF errors are transient. Wrap the polling loop with a retry (up to 3 attempts, 5-10s delay) rather than failing immediately.
- **Batch video generation pattern**: When generating videos for a multi-shot storyboard:
  1. Submit all tasks in order (they queue server-side)
  2. Poll all tasks concurrently using a thread pool, with max concurrency = `cloudy_veo.concurrency_limit` from config
  3. For failed tasks, modify the prompt to be less visually aggressive and resubmit
  4. Download each completed result immediately before moving to the next
  5. Record task_id, cost, and result metadata for each shot
