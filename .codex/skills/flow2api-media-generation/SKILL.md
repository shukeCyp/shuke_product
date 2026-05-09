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

Unless the user explicitly chooses otherwise, use these models:

- Image generation / image editing: `gemini-3.1-flash-image-portrait`
- Text-to-video: `veo_3_1_t2v_fast_portrait`
- Image-to-video / first-last-frame video: `veo_3_1_i2v_s_fast_portrait_fl`

These defaults are portrait/vertical-first for short-form social and ecommerce workflows.

## Environment Assumptions

Default flow2api endpoint for this workspace:

```bash
FLOW2API_BASE_URL="https://flow.lyvideo.top"
FLOW2API_API_KEY="sk-hetang"
```

Use these values by default when making or showing flow2api requests. Allow explicit user overrides for a different server or key.

## Concurrency Limit

For this workspace, keep a shared media-generation concurrency limit of 5:

- Image generation and video generation share the same 5-slot pool.
- Do not launch more than 5 total flow2api generation requests at once.
- Batch image jobs may run up to 5 parallel requests.
- If a mixed image/video batch has more than 5 items, queue the remaining items until a slot finishes.

## Model Selection

Use portrait defaults first:

- General vertical image: `gemini-3.1-flash-image-portrait`
- Higher-res vertical image: `gemini-3.1-flash-image-portrait-2k` or `gemini-3.1-flash-image-portrait-4k`
- Square image: `gemini-3.1-flash-image-square`
- 4:5-ish image is not a native flow2api alias; use portrait or `three-four` depending on need.
- Text-to-video vertical fast: `veo_3_1_t2v_fast_portrait`
- Text-to-video 4s/6s vertical fast: `veo_3_1_t2v_fast_portrait_4s`, `veo_3_1_t2v_fast_portrait_6s`
- Image-to-video vertical fast: `veo_3_1_i2v_s_fast_portrait_fl`
- Image-to-video 4s/6s vertical fast: `veo_3_1_i2v_s_fast_portrait_4s_fl`, `veo_3_1_i2v_s_fast_portrait_6s_fl`
- First/last-frame Lite transition: `veo_3_1_interpolation_lite_portrait` when the user specifically asks for Lite transition.
- Multi-reference video: `veo_3_1_r2v_fast_portrait`, current upstream protocol supports up to 3 reference images.

Important behavior:

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

## OpenAI-Compatible Text-To-Image

Use `/v1/chat/completions` for the simplest flow2api call.

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3.1-flash-image-portrait",
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
    "model": "gemini-3.1-flash-image-portrait",
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

Default model can be either direct portrait alias or base alias plus image config:

```bash
curl -X POST "$FLOW2API_BASE_URL/models/gemini-3.1-flash-image:generateContent" \
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
            "text": "Create a vertical portrait ecommerce hero image for a compact travel organizer on a clean hotel desk, realistic morning light, premium but practical style, no text."
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

Flow2API resolves `gemini-3.1-flash-image` with `imageConfig.aspectRatio` to internal aliases such as `gemini-3.1-flash-image-portrait`.

## OpenAI-Compatible Text-To-Video

Default to `veo_3_1_t2v_fast_portrait`.

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo_3_1_t2v_fast_portrait",
    "messages": [
      {
        "role": "user",
        "content": "Vertical 9:16 handheld UGC-style video of a young woman opening a compact travel organizer on a hotel desk. She pulls out a charger, passport, and lip balm in one smooth motion, showing how much fits inside. Natural morning window light, realistic room tone, slight handheld phone movement. Audio: soft zipper sound and casual room ambience, no subtitles."
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

Default to `veo_3_1_i2v_s_fast_portrait_fl`.

One image means first-frame image-to-video:

```bash
curl -N -X POST "$FLOW2API_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $FLOW2API_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo_3_1_i2v_s_fast_portrait_fl",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Animate this product image as a vertical 9:16 ecommerce video. Slow push-in toward the product, soft window light shifts slightly, tiny highlights move across the packaging, background remains clean and minimal. Preserve product shape, logo, label, and composition. Audio: subtle room tone and a soft product click, no dialogue."
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
    "model": "veo_3_1_i2v_s_fast_portrait_fl",
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
    "model": "veo_3_1_r2v_fast_portrait",
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
- T2V with images: the model ignores images; switch to `veo_3_1_i2v_s_fast_portrait_fl`.
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
