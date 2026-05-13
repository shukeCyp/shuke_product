---
name: flow2api-media-generation
description: Use this skill to generate images and videos through TheSmallHanCat/flow2api, an OpenAI-compatible API wrapper for Google Flow. Covers text-to-image, image-to-image, text-to-video, image-to-video, first/last-frame video, default portrait models, request formats, base64 image inputs, streaming, result extraction, and prompt workflows for ecommerce/social media assets.
---

# Flow2API Media Generation

Use this skill when the user wants to generate images or videos through `flow2api`, write flow2api request bodies, debug flow2api media calls, or build image/video production workflows using Google Flow models.

## Project Facts

Source project: https://github.com/TheSmallHanCat/flow2api

Flow2API exposes a unified OpenAI-compatible API for Google Flow:

- Image: text-to-image and image-to-image.
- Video: text-to-video, image-to-video, first/last-frame video, multi-reference video, video upscale.
- OpenAI-compatible endpoint: `POST /v1/chat/completions`.
- Gemini-compatible endpoints:
  - `POST /models/{model}:generateContent`
  - `POST /v1beta/models/{model}:generateContent`
  - `POST /models/{model}:streamGenerateContent`
  - `POST /v1beta/models/{model}:streamGenerateContent`
- Auth supports `Authorization: Bearer <api_key>`. Gemini-compatible endpoints also support `x-goog-api-key` or `?key=`.
- Streaming is recommended for long video jobs because progress is returned as SSE chunks.

## Required Defaults

Read workspace defaults from:

```text
../config/media_services.yaml
```

Use these config keys unless the user explicitly chooses otherwise:

- Image generation / image editing: `flow2api.models.image_default`
- Text-to-video: `flow2api.models.text_to_video_default`
- Image-to-video / first-last-frame video: `flow2api.models.image_to_video_default`
- Multi-reference video: `flow2api.models.multi_reference_video_default`
- First/last-frame Lite transition: `flow2api.models.interpolation_lite`

These are the workspace's default 8-second portrait video models. If a video prompt or storyboard shot does not explicitly mark a duration, treat it as 8 seconds. Do not switch to 4s/6s video model aliases unless the user explicitly asks for shorter model variants.

## Environment Assumptions

Default flow2api endpoint and credentials are stored only in the workspace config:

```text
../config/media_services.yaml
```

Load `flow2api.base_url`, `flow2api.api_key`, `flow2api.concurrency_limit`, and `flow2api.models.*` before making requests. Do not paste real API keys into SKILL instructions, prompts, logs, or user-facing examples. Allow explicit user overrides for a different server, key, or model.

## Concurrency Limit

For this workspace, read the shared media-generation concurrency limit from `flow2api.concurrency_limit`:

- Image generation and video generation share the same 5-slot pool.
- Do not launch more than 5 total flow2api generation requests at once.
- Batch image jobs may run up to 5 parallel requests.
- If a mixed image/video batch has more than 5 items, queue the remaining items until a slot finishes.

## Model Selection

Use configured portrait defaults first:

- General vertical image: `flow2api.models.image_default`.
- Text-to-video vertical fast: `flow2api.models.text_to_video_default`.
- Image-to-video vertical fast: `flow2api.models.image_to_video_default`.
- First/last-frame Lite transition: `flow2api.models.interpolation_lite` when the user specifically asks for Lite transition.
- Multi-reference video: `flow2api.models.multi_reference_video_default`, current upstream protocol supports up to 3 reference images.
- For higher-resolution, square, 4s, or 6s variants, use an explicit user-provided model or update the config first.

Important behavior:

- Workspace default for generated videos is the configured 8-second model alias without shorter-duration suffixes.
- If duration is missing, write `Format: 8 seconds` in the prompt and use the 8-second model.
- If a storyboard contains shorter planning beats, still use the 8-second model by default and tell the user which part can be trimmed in editing.
- T2V models do not support images. If images are sent, flow2api ignores them.
- I2V models require 1-2 images. One image is the first frame. Two images are first frame + last frame.
- R2V models support multiple reference images, currently up to 3.
- For I2V single-frame mode, flow2api strips the upstream `_fl` suffix internally.

## Prompt Quality

For prompt writing, combine this skill with:

- `nanobanana2-image-prompting` for image prompt craft.
- `veo31-video-prompting` for video prompt craft.

Keep final media prompts concise and concrete:

- Image: purpose, subject, composition, lighting, camera, material, text constraints, preservation.
- Video: camera, subject, one action, environment movement, lighting, style, audio.

For ecommerce/social media, default to portrait, clean product focus, one purchase-driving proof, and no unnecessary text overlays.

When a `product-image-video-storyboard` task provides reference assets, attach them to every relevant image-generation call:

- `product_reference_board`: use for product scale, packaging details, labels, and handling.
- `character_reference_sheet`: use for the same face, hands, hairstyle, wardrobe, expressions, manicure, and jewelry.
- `scene_reference_image`: use for the same location, lighting direction, counter/table layout, and background objects.
- Original product image: attach as a secondary reference when exact packaging fidelity matters.

Do not generate storyboard first frames from text alone when these references exist. Prompts should explicitly forbid second-person hands, extra hands, background people, assistants, bystanders, and unrelated mirror reflections.

For the user's current production workflow, generated clips should feel like real captured footage, not polished commercial ads:

- Use real-shot / live-action / UGC phone-camera language.
- Prefer natural handheld movement, practical room light, real bathroom/kitchen/vanity/counter settings, and ordinary human handling.
- Avoid "premium commercial lighting", "hero reveal", "cinematic ad", "glowing aura", dramatic product orbit, floating UI, fake poster composition, and overly perfect studio backgrounds unless explicitly requested.
- Keep adjacent storyboard clips connected: same room, same product state, same person/hand identity, same wardrobe, same lighting direction, and logical physical continuity from one shot to the next.
- When generating a batch, include continuity notes from the previous and next shot in each prompt so the sequence does not jump between unrelated scenes.

## OpenAI-Compatible Text-To-Image

Use `/v1/chat/completions` for the simplest flow2api call.

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "$FLOW2API_IMAGE_MODEL",
    "messages": [
      {
        "role": "user",
        "content": "Create a 9:16 premium ecommerce product image of a matte black travel thermos on a warm cafe table. Center the product in the lower third, leave clean negative space at the top for headline copy, soft morning window light, realistic contact shadow, crisp metal texture, no text, no extra products."
      }
    ],
    "stream": true
  }'
```

Expected OpenAI-style final content is a Markdown image:

```markdown
![Generated Image](https://...)
```

## OpenAI-Compatible Image-To-Image

Send multimodal `messages[].content` with text and `image_url`.

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "$FLOW2API_IMAGE_MODEL",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Using the provided product image, replace only the background with a warm minimalist bathroom shelf scene. Keep the product shape, label, logo, color, angle, and crop unchanged. Add realistic contact shadows and soft window light. No extra text or distorted packaging."
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/jpeg;base64,<base64_encoded_image>"
            }
          }
        ]
      }
    ],
    "stream": true
  }'
```

Supported image URI patterns:

- `data:image/jpeg;base64,...`
- `data:image/png;base64,...`
- `http://...` or `https://...`
- flow2api cached media URLs returned by the service

## Gemini-Compatible Image Generation

Use Gemini-compatible endpoint when the caller already uses Gemini API request shapes or wants `generationConfig.imageConfig`.

Default model comes from `flow2api.models.image_default`; Gemini-compatible calls may also use a base image model plus image config if the configured service supports it:

```bash
curl -X POST "$FLOW2API_BASE_URL/models/$FLOW2API_IMAGE_MODEL:generateContent" \
  -H "x-goog-api-key: $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "systemInstruction": {
      "parts": [{ "text": "Return an image only." }]
    },
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Create a vertical portrait real-shot ecommerce reference image for a compact travel organizer on a clean hotel desk, realistic morning light, practical creator-style framing, no text."
          }
        ]
      }
    ],
    "generationConfig": {
      "responseModalities": ["IMAGE"],
      "imageConfig": {
        "aspectRatio": "9:16",
        "imageSize": "1K"
      }
    }
  }'
```

Flow2API may resolve base image models with `imageConfig.aspectRatio` to internal portrait aliases, depending on the configured service.

## OpenAI-Compatible Text-To-Video

Default to `flow2api.models.text_to_video_default`.

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "$FLOW2API_T2V_MODEL",
    "messages": [
      {
        "role": "user",
        "content": "Vertical 9:16 handheld real-shot UGC video of a young woman opening a compact travel organizer on a hotel desk. She pulls out a charger, passport, and lip balm in one smooth motion, showing how much fits inside. Natural morning window light, realistic room tone, slight handheld phone movement. Format: 8 seconds. Audio: soft zipper sound and casual room ambience, no subtitles."
      }
    ],
    "stream": true
  }'
```

Expected final OpenAI-style content is an HTML video snippet inside a fenced block:

```html
<video src='https://...' controls></video>
```

## OpenAI-Compatible Image-To-Video

Default to `flow2api.models.image_to_video_default`.

One image means first-frame image-to-video:

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "$FLOW2API_I2V_MODEL",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Animate this product image as a vertical 9:16 real-shot UGC video. Use natural handheld phone-camera movement and practical room light. Preserve product shape, logo, label, scale, and composition. Keep the action physically continuous with the previous and next storyboard shot. Format: 8 seconds. Audio: subtle room tone and a soft product handling sound, no subtitles."
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/jpeg;base64,<first_frame_base64>"
            }
          }
        ]
      }
    ],
    "stream": true
  }'
```

## First/Last-Frame Video

Use the same default I2V model and provide exactly 2 images. The first image is the first frame; the second image is the last frame.

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "$FLOW2API_I2V_MODEL",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Create a seamless vertical transition from the first frame to the last frame. The product starts closed on the desk, then the lid opens smoothly and the organized interior is revealed. Keep product identity, scale, lighting, and camera angle consistent. Audio: soft latch click and gentle reveal sound, no subtitles."
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/jpeg;base64,<first_frame_base64>"
            }
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/jpeg;base64,<last_frame_base64>"
            }
          }
        ]
      }
    ],
    "stream": true
  }'
```

## Multi-Reference Video

Use only when the user supplies multiple references and wants reference-image-guided video. Current R2V supports up to 3 reference images.

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "$FLOW2API_R2V_MODEL",
    "messages": [
      {
        "role": "user",
        "content": [
          { "type": "text", "text": "Use reference image 1 for the exact product, reference image 2 for the hand pose, and reference image 3 for the warm cafe lighting. Generate a vertical product demo video with a slow handheld push-in. Preserve the product logo and proportions." },
          { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<ref1>" } },
          { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<ref2>" } },
          { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<ref3>" } }
        ]
      }
    ],
    "stream": true
  }'
```

## Video Extend

Flow2API can detect `extend://MEDIA_ID` in an `image_url` item as a video extension source. Use this only if the user has a known upstream media id, not merely a public video URL.

```json
{
  "type": "image_url",
  "image_url": {
    "url": "extend://<media_id>"
  }
}
```

## Result Extraction

When handling responses:

- For images, extract the URL from Markdown: `![Generated Image](URL)`.
- For videos, extract the URL from HTML: `<video src='URL' controls></video>`.
- Gemini-compatible responses return `candidates[].content.parts[]`; image parts can be returned as `inlineData` or `fileData`, video parts as `fileData`.
- Streaming chunks may place progress text in `choices[0].delta.reasoning_content`; wait for the final media URL before reporting completion.

## Base64 Image Input Helper

For shell usage:

```bash
IMG_B64="$(base64 -i ./path/to/image.jpg | tr -d '\n')"
DATA_URL="data:image/jpeg;base64,$IMG_B64"
```

Use the correct MIME type:

- JPEG: `data:image/jpeg;base64,...`
- PNG: `data:image/png;base64,...`
- WebP: `data:image/webp;base64,...`

## Prompt Recipes

### Vertical Ecommerce Image

```text
Create a 9:16 vertical ecommerce hero image for [product]. The product is centered in the lower third with clean negative space at the top. Show [one purchase-driving feature]. Use [lighting], [surface/background], realistic contact shadows, crisp material detail, and no text. Preserve exact logo and packaging shape if a reference image is provided.
```

### Vertical UGC Video

```text
Vertical 9:16 handheld phone-style video of [target user] demonstrating [product] in [real setting]. One clear action: [action]. Natural practical lighting, slight handheld movement, realistic scale and human interaction. Audio: [short dialogue or SFX], no subtitles.
```

### Product First-Frame Animation

```text
Animate this image as a vertical 9:16 product video. Use a slow push-in, subtle environmental motion, and realistic highlights moving across [material]. Preserve the product logo, shape, label, composition, and lighting. Audio: [SFX/ambience], no dialogue.
```

### First/Last-Frame Reveal

```text
Create a seamless transition from the first frame to the last frame. The motion begins with [start state], changes through [physical transition], and ends exactly on [end state]. Preserve camera angle, product identity, scale, and lighting. Audio: [sound progression], no subtitles.
```

## Troubleshooting

- `Prompt cannot be empty`: ensure at least one text part exists in the final user message.
- T2V with images: the model ignores images; switch to `flow2api.models.image_to_video_default`.
- I2V image count error: provide 1 image for first-frame animation or 2 images for first/last-frame transition.
- R2V image count error: provide no more than 3 reference images.
- Wrong orientation: use portrait default model or Gemini `imageConfig.aspectRatio: "9:16"`.
- Bad text/logo: use image model with a clean reference, preserve logo, and reduce text length.
- Long video waits: use `stream: true` and keep the SSE connection open.
- Returned URL points to local cache: configure flow2api cache base URL if external clients need public access.
- Captcha/token failures: check management UI, token status, VideoFX credits, captcha method, `/health`, and `/api/tokens`.

## Source Links

- Flow2API repository: https://github.com/TheSmallHanCat/flow2api
- README model list and API examples: https://github.com/TheSmallHanCat/flow2api/blob/main/README.md
- Model resolver behavior: https://github.com/TheSmallHanCat/flow2api/blob/main/src/core/model_resolver.py
- API route behavior: https://github.com/TheSmallHanCat/flow2api/blob/main/src/api/routes.py
- Generation handler and model config: https://github.com/TheSmallHanCat/flow2api/blob/main/src/services/generation_handler.py
