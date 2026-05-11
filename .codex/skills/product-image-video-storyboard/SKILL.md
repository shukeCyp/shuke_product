---
name: product-image-video-storyboard
description: "Use by default when the user provides product images and wants ecommerce short-video planning, visual expansion, storyboard scripts, first-frame images, or video prompts. First generate foundation references without asking for direction: product reference board with the imagegen skill, then character reference sheet and multi-view scene reference board with the flow2api-media-generation skill. All flow2api image generations must run concurrently in batches, respecting the flow2api concurrency limit. Later first-frame images must use all three references, then be reviewed for clipping, body/object penetration, distorted hands, packaging errors, and abnormal visuals. Then retrieve from the local 剧本 library, adapt scripts, and create connected real-shot prompts plus 8-second video prompts. Avoid extra people, second-person hands, and scene jumps."
---

# Product Image Video Storyboard

## Overview

Convert a product image into a reusable ecommerce short-video production plan. Always start by directly generating a foundation set: product reference board, character reference sheet, and scene reference board. Use `imagegen` for the product reference board. Use `flow2api-media-generation` for the character reference sheet and multi-view scene reference board. All image generations that use Flow/flow2api must be launched concurrently in batches instead of one-by-one, while respecting the flow2api skill's shared concurrency limit. Use these references as the primary visual anchors for every later first-frame image, then use the local script library to create a custom storyboard and video generation prompts. Default each generated video prompt to 8 seconds when no duration is explicitly marked.

## Trigger Behavior

Use this skill when the user provides a product photo, packaging photo, product render, listing image, or reference product image and asks for any of:

- a product video script
- a short-form ad storyboard
- image-to-video prompts
- first-frame images
- product usage scenes
- ecommerce creative variations
- "帮我用这个产品图做视频/分镜/素材"

If the user provides a product image without a detailed brief, infer a practical ecommerce direction from the image and proceed. Do not pause to ask the user to choose a direction unless the product category is genuinely impossible to infer.

## Required Workflow

1. Inspect the product image and extract visible facts:
   - product type, color, material, packaging, label text, likely use case
   - visual constraints that must be preserved
   - unclear details that should not be invented aggressively
2. Directly use the `imagegen` skill to generate exactly one product reference board:
   - use the built-in `image_gen` tool by default, following the imagegen skill's save-path policy
   - include product multi-view angles
   - include approximate product dimensions/scale using visual dimension markers, a ruler/grid, hand scale, or common-object scale
   - include product detail panels such as front label, cap/lid, side/back detail, texture/material, ingredient/benefit badge, included parts, capsules/accessories, or applicator depending on product type
   - include one realistic usage-context thumbnail only if it helps clarify scale or use
   - keep it as one image/canvas, not a set of separate outputs
   - preserve packaging/logo/shape as much as possible
3. Directly use the `flow2api-media-generation` skill to generate exactly one character reference sheet:
   - use the default flow2api image model unless the user explicitly chooses another model
   - when another flow2api image job is ready at the same time, launch them concurrently as one batch
   - create one primary creator/customer/hand-model identity suitable for the product and target market
   - include face front view, 45-degree view, side view, and half/body framing when relevant
   - include detailed hand reference: skin tone, hand shape, nail length/color, jewelry, sleeve cuff, and product grip style
   - include expression set: neutral, problem/pain-point concern, explaining/pointing, applying/using, satisfied result, CTA smile
   - include wardrobe, hairstyle, makeup, accessories, and body type
   - keep it as one reference sheet with the same person only
4. Directly use the `flow2api-media-generation` skill to generate exactly one multi-view scene reference board:
   - use the default flow2api image model unless the user explicitly chooses another model
   - launch concurrently with the character reference sheet when both prompts are ready
   - show the main real-shot location where the sequence will happen
   - include multiple camera views of the same scene: wide establishing view, counter/table action view, product close-up zone, selfie/creator angle, and optional top-down layout view when useful
   - include stable lighting direction, counter/table layout, background objects, and product placement zone
   - make it practical and repeatable for every shot, not a decorative ad set
5. Do not show the internal generation prompts to the user by default. Report the generated reference paths/URLs only.
6. If `imagegen` or `flow2api-media-generation` cannot be used in the current environment, state the blocker concisely instead of pretending the images were generated.
7. Save or record the generated references as:
   - `product_reference_board`
   - `character_reference_sheet`
   - `scene_reference_board`
8. Query the local `剧本/` library for relevant references.
9. Adapt the matched references into an original storyboard for the user's product.
10. For every storyboard shot, create:
   - shot goal
   - duration beat, normally 3-6 seconds for planning
   - final generation duration, default 8 seconds when unspecified
   - first-frame image prompt
   - video prompt with explicit duration
   - voiceover or on-screen text if useful
   - edit note for how the user can trim or combine clips manually
11. After all first-frame images are generated, review every first frame before moving to video generation:
   - check for body/object penetration, hands merging into product/body, impossible joints, extra fingers, missing fingers, distorted hands, face drift, changed actor, wardrobe mismatch, packaging deformation, label/text errors, inconsistent scene layout, impossible contact shadows, and unrelated extra people/objects
   - write a first-frame QA table with status `pass`, `needs_regeneration`, or `usable_with_crop/edit`
   - regenerate any `needs_regeneration` first frame before using it for video generation unless the user explicitly accepts the flaw
   - record the final approved first-frame paths and the QA notes

Never ask the user to confirm the product direction before script retrieval unless the input image is ambiguous enough that proceeding would create the wrong product.

## Flow2API Image Concurrency

For this skill, "all Flow image generation must be concurrent" means:

- Any image job using `flow2api-media-generation` must be submitted as part of a batch whenever more than one flow image is needed.
- Respect the flow2api skill's shared media-generation concurrency limit, currently 5 total in-flight jobs across image and video generation.
- After the product reference board is available, generate `character_reference_sheet` and `scene_reference_board` concurrently because they are independent Flow image jobs.
- When generating storyboard first-frame images with Flow, submit up to 5 first frames at once, then queue the remaining frames until a slot finishes.
- When QA marks multiple first frames as `needs_regeneration`, regenerate those failed frames concurrently, again capped at 5 in-flight Flow jobs.
- Do not intentionally run Flow image jobs one-by-one unless there is only one job, a prior output is required to write the next prompt, the concurrency pool is full, or the user explicitly requests sequential generation.
- Video generation may also use Flow, but this section is specifically about image generation; still respect the same shared 5-slot pool when image and video jobs overlap.

## Character Consistency

If any person, model, hand model, creator, actor, or customer appears in the storyboard:

1. Define a `Character Identity Lock` before the storyboard:
   - age range, gender presentation, ethnicity/skin tone when visible, face shape, hairstyle, hair color, body type, wardrobe, accessories, makeup style, and overall vibe
   - stable camera-visible details such as nail color, sleeve color, jewelry, glasses, tattoos, or facial hair
2. Generate and save `character_reference_sheet` before storyboard first frames.
3. Reuse the same identity lock in every first-frame prompt and every video prompt that includes a person.
4. Keep wardrobe, hairstyle, makeup, accessories, and hand appearance consistent unless a shot explicitly requires a change.
5. If using image-generation or video-generation systems that support reference images, instruct the model to use the product reference board, character reference sheet, and scene reference board together.
6. Do not introduce a different person between shots. If multiple people are truly needed, ask the user first; default to one person only.
7. Do not generate second-person hands, extra hands, background people, mirror reflections of another person, assistants, customers, or bystanders unless explicitly requested.
8. For hand-only shots, still use the same character reference sheet: skin tone, hand shape, nail length/color, jewelry, sleeve, and grip style must match the creator.

## Imagegen Product Reference Board

Use the `imagegen` skill for the first generated image. In normal operation, use the built-in `image_gen` tool rather than the CLI fallback. Do not display this internal prompt to the user unless explicitly asked for prompts:

```text
Create one single vertical 9:16 ecommerce product reference board from the provided product image.

Product: [visible product name/category].
Preserve: the original product shape, packaging structure, logo placement, label hierarchy, color palette, material finish, and all distinctive visual details from the reference image. Do not redesign the product.

Canvas layout: one clean 9:16 reference board with organized product information, not a sales poster.

Required sections:
1. Product scale: show the approximate product size using a simple dimension marker, ruler/grid, hand scale, or common-object scale. If real measurements are unknown, label the scale as approximate and infer from product type.
2. Multi-view product: front view, 45-degree angled view, side/back detail view.
3. Detail close-ups: logo/brand area, label typography, cap/lid or closure, benefit badge or ingredient area, material/texture, and included item details such as capsules, applicator, nozzle, brush, cable, or accessories when relevant.
4. Usage-context thumbnail: one small practical scene showing how the product is held, opened, applied, taken, placed, or used, only to clarify scale and handling.

Photography style: photorealistic commercial product reference board, sharp focus, accurate scale, realistic shadows, clean neutral background, premium but practical, not over-stylized.

Output: exactly one image only, vertical 9:16. The board will become the master visual reference for storyboard first-frame generation.

Avoid: changing the product design, adding unrelated props, fake unreadable labels, extra logos, distorted hands, duplicate products with inconsistent packaging, decorative collage borders, tiny dense text, false certifications, or medical/guaranteed-result claims.
```

After generating the board, use it as `product_reference_board` for every later first-frame generation. The original product image may be included as a secondary reference when exact packaging preservation is important, but the generated board is the primary reference.

## Flow2API Character Reference Sheet

Use the `flow2api-media-generation` skill for the character reference sheet after the product reference board. Use the workspace default image model, normally `gemini-3.1-flash-image-portrait`, unless the user explicitly chooses another model. Do not display this internal prompt to the user unless explicitly asked for prompts:

```text
Create one single vertical 9:16 character reference sheet for a real-shot ecommerce UGC creator who will appear in all later product storyboard images and videos.

Product context: [product category and target market inferred from product image].
Character role: one creator/customer/hand model only. The character must look like a real person filmed in a phone-camera UGC video, not a model in a polished ad campaign.

Required sections in one reference sheet:
1. Face identity: front view, 45-degree view, side view, and natural selfie framing. Keep the exact same person across all views.
2. Expression set: neutral, concerned/problem reaction, explaining to camera, applying/using product, satisfied result, and CTA smile.
3. Hand detail: both hands visible in close-up, skin tone, hand shape, nail length/color, rings/bracelets if any, sleeve cuff, and natural product grip pose.
4. Wardrobe and styling: hair length/style/color, makeup, earrings/accessories, top/jacket, and body framing.
5. Continuity notes visually implied: same person, same hands, same wardrobe, same hair, same makeup, no alternate actor.

Style: photorealistic real-shot UGC reference sheet, practical natural light, clean neutral background, high detail in face and hands, no beauty-ad retouching.

Avoid: a second person, extra hands, mismatched hands, different hairstyles, different outfits, distorted fingers, exaggerated expressions, fashion editorial lighting, studio ad styling, fake text labels, or background bystanders.
```

Save or record the result as `character_reference_sheet`. Use it for every first-frame image that includes a face, body, or hands.

## Flow2API Multi-View Scene Reference Board

Use the `flow2api-media-generation` skill for the scene reference after the character sheet. Generate a multi-view scene reference board, not a single isolated room photo. Use the workspace default image model, normally `gemini-3.1-flash-image-portrait`, unless the user explicitly chooses another model. Do not display this internal prompt to the user unless explicitly asked for prompts:

```text
Create one single vertical 9:16 real-shot multi-view scene reference board for the product storyboard.

Scene purpose: a consistent location where all shots can plausibly happen in one continuous UGC filming session.
Product context: [product category and natural usage location].

Required scene details:
1. Main location: [bathroom vanity / kitchen table / bedroom mirror / car seat / desk / gym bag / other location inferred from product].
2. Multi-view scene panels in the same board:
   - wide establishing view of the whole usable location
   - product placement view showing where the product sits
   - hand/action close-up view showing the surface where use or texture shots happen
   - selfie/creator camera view showing where a person can stand or sit
   - optional top-down layout map if it helps maintain continuity
3. Stable layout: product placement zone, hand/action zone, mirror/counter/table position, and 3-5 simple background objects that should remain consistent.
4. Lighting: practical real room light direction, time of day, shadow behavior, and color temperature.
5. Camera logic: where a phone camera or hand-held camera would naturally be placed for each view.
6. Continuity: the scene must support all storyboard shots without changing rooms unless the script requires a clear transition.

Style: photorealistic real-shot UGC environment, ordinary lived-in but clean, practical natural light, not a commercial studio set.

Avoid: extra people, second-person hands, ad props, floating product displays, poster composition, dramatic commercial lighting, unrelated decor, mismatched rooms between panels, inconsistent lighting between panels, or backgrounds that cannot be repeated across shots.
```

Save or record the result as `scene_reference_board`. Use it for every first-frame image to keep the environment consistent.

## Script Retrieval

After `product_reference_board`, `character_reference_sheet`, and `scene_reference_board` are generated and recorded, use the `commerce-script-retrieval` workflow if available. Otherwise, search these local files directly:

```text
剧本/index/videos.jsonl
剧本/tags/<video_id>.json
剧本/analyses/<video_id>/analysis.md
```

Prefer references by this order:

1. same product category
2. same target audience or pain point
3. compatible hook style
4. compatible proof method
5. strong visual remake potential
6. clear CTA or conversion structure

Use the references for structure only. Do not copy wording unless the user explicitly asks for close imitation.

## Storyboard Output Format

Return the adapted plan in this order:

1. Product assumptions
2. Matched reference videos
3. Core selling angle
4. Storyboard table
5. Asset-generation prompts
6. Generated reference paths/URLs:
   - `product_reference_board`
   - `character_reference_sheet`
   - `scene_reference_board`
7. First-frame QA review, if first-frame images were generated:
   - per-shot status
   - abnormality notes
   - regeneration/crop/edit decision
   - final approved first-frame path

Use this table shape for the storyboard:

| 镜头 | 规划时长 | 生成时长 | 画面 | 口播/字幕 | 首帧图提示词 | 视频提示词 | 剪辑备注 |
|---|---:|---:|---|---|---|---|---|
| 1 | 4s | 8s | ... | ... | ... | ... | ... |

Rules:

- `规划时长` can be 3-6 seconds by default.
- `生成时长` defaults to 8 seconds if the user has not explicitly marked another duration.
- Use the 8-second video model by default. If the beat is shorter than 8 seconds, still generate 8 seconds and add an edit note for where to trim.
- Write prompts in English for image/video models unless the visible text or voiceover must be Chinese.
- Keep each video prompt to one clear physical beat.
- If a product label or text must appear, quote exact text and warn about text-rendering risk.
- For first-frame prompts, describe a static real-shot UGC frame.
- Generate first-frame images by attaching `product_reference_board`, `character_reference_sheet`, and `scene_reference_board` as the primary references. Do not generate first-frame images from text alone when these references are available.
- If first-frame images are generated with Flow/flow2api, launch them concurrently in batches with up to 5 in-flight jobs.
- When exact packaging matters, also attach the original product image, with the board used for scale/detail guidance and the original used for packaging fidelity.
- For video prompts, describe motion from that first frame over the chosen duration.
- Make the full video sequence coherent: every shot should feel like it happened in the same real shoot, with a logical before/after relationship to the neighboring shots.
- Keep continuity across shots: same product state, same room or compatible adjacent room, same lighting direction, same person/hand identity, same wardrobe, and plausible hand/object position changes.
- Avoid second-person hands and extra people. If the shot needs a hand, it must be the same creator's hand from `character_reference_sheet`.
- Prefer real-shot UGC footage language over advertising language: handheld phone camera, practical room light, natural counter/bathroom/kitchen setting, ordinary human handling, realistic imperfections, no studio hero ad look.
- Avoid disconnected scene jumps, poster-style product compositions, cinematic ad lighting, floating UI, fake glow effects, exaggerated hero orbits, and overly polished commercial packshots unless the user explicitly asks for ads.
- When a person appears, include the exact `Character Identity Lock` in the prompt or reference it explicitly by label.
- Add edit notes such as "use full 5-second clip", "trim after product contact", "use middle 3 seconds as transition", or "cut on reaction moment".

## Prompt Standards

First-frame image prompt:

```text
Create a vertical 9:16 photorealistic first frame for a real-shot UGC ecommerce video. The product is [product], preserving [key appearance]. Character Identity Lock if a person appears: [same stable character description across every shot]. Continuity: this frame should logically follow [previous shot state] and lead into [next shot state]. Composition: [shot framing]. Action state: [frozen moment]. Scene: [real home/bathroom/kitchen/counter setting]. Lighting: [practical natural room light]. Leave clean space for optional subtitles. No distorted hands, no changed packaging, no extra logos, no different actor from other shots, no polished studio ad look.
```

When calling the image model for first frames, attach `product_reference_board`, `character_reference_sheet`, and `scene_reference_board`. If exact packaging matters, also attach the original product image. Add:

```text
Use the attached product reference board for product scale, packaging details, close-up features, and handling. Use the attached character reference sheet for the exact same face, hands, hair, wardrobe, expressions, manicure, jewelry, and body identity. Use the attached multi-view scene reference board for the same location, lighting direction, counter/table layout, background objects, product placement zone, action zone, and camera angles. Preserve one person only. Do not add second-person hands, background people, assistants, bystanders, or extra hands.
```

Video prompt:

```text
Camera: [shot type and motion].
Subject: [product/person with preserved product details and the same Character Identity Lock when a person appears].
Continuity: this shot begins from [previous shot ending state] and ends ready for [next shot beginning state].
Action: [one clear natural motion over the chosen duration].
Scene: [real usage context and practical background behavior].
Lighting: [natural/practical room light with realistic shadow behavior].
Style: real-shot UGC phone footage, photorealistic, vertical 9:16, not a polished commercial ad.
Audio: [voiceover/sfx/ambient direction if needed].
Format: [duration] seconds; if duration is not explicitly marked, use 8 seconds.
Negative: no product redesign, no unreadable fake text, no extra fingers, no distorted packaging, no disconnected scene jump, no different actor, no changed hairstyle, no changed wardrobe unless specified, no cinematic ad lighting, no floating product, no studio hero shot.
```

## First-Frame QA Review

After generating all storyboard first-frame images, inspect each image before video generation. Do not skip this review.

Use this QA table:

| 镜头 | 首帧路径/URL | 状态 | 异常检查 | 处理决定 |
|---|---|---|---|---|
| 1 | ... | pass / needs_regeneration / usable_with_crop/edit | ... | ... |

Check at minimum:

- `穿模/接触错误`: hand penetrates product/body/counter, product floats, impossible contact or shadows
- `手部异常`: extra fingers, missing fingers, fused fingers, distorted nails, mismatched jewelry/sleeve
- `人物一致性`: different face, changed hairstyle, changed wardrobe, different makeup/accessories, extra people or mirror people
- `产品一致性`: changed packaging shape, unreadable or wrong key label, wrong cap, missing logo hierarchy, invented claims/badges
- `场景一致性`: changed room, lighting direction mismatch, background objects missing or jumping, impossible camera angle
- `画面可用性`: subject cropped awkwardly, important product hidden, subtitle space blocked, motion-start pose unclear

If any first frame is `needs_regeneration`, regenerate it using the same references and a tighter prompt that names the exact problem. Only proceed to video generation with `pass` or explicitly accepted `usable_with_crop/edit` frames.

## User-Facing Behavior

When a product image is provided, do not first ask for market direction and do not print internal generation prompts. Do the work in this order:

1. Generate one product reference board with the `imagegen` skill.
2. Generate one character reference sheet with the `flow2api-media-generation` skill and one multi-view scene reference board with the `flow2api-media-generation` skill concurrently.
3. Respect the flow2api shared concurrency limit for every Flow image batch.
4. Tell the user the three references were generated and provide their paths/URLs.
5. Continue to retrieval-backed storyboard creation if the user requested scripts, first frames, or videos.
6. Use the generated product, character, and multi-view scene references for all first-frame image generation; when using Flow, generate first frames concurrently in batches.
7. After all first-frame images are generated, audit them for clipping, penetration, hand defects, product-label issues, actor drift, scene inconsistency, and other abnormal visuals. Provide the QA table and regenerate failed frames before video generation unless the user accepts them.
