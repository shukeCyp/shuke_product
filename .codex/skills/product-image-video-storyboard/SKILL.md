---
name: product-image-video-storyboard
description: "Use by default when the user provides product images and wants ecommerce short-video planning, storyboard scripts, first-frame image prompts, video prompts, generated images, or generated videos. When a product image is provided, run the full workflow by default until final video assets are produced, unless the user explicitly asks for prompts/planning only. All image and video generation is handled through Codex skills."
---

# Product Image Video Storyboard

## Overview

Convert a product image into a reusable ecommerce short-video production plan and final generated media package. When the user provides a product image, the default is end-to-end execution: generate foundation references, retrieve examples, write the storyboard, generate first-frame images, generate videos, and save final assets. Stop at prompts/planning only when the user explicitly asks for that. Use the configured active image-generation provider for all raster image generation/editing, including the product reference board. Use the workspace video/media generation skills such as `flow2api-media-generation`, `veo31-video-prompting`, and `nanobanana2-image-prompting` when their scoped instructions apply.

## Trigger Behavior

Use this skill whenever the user provides a product photo, packaging photo, product render, listing image, or reference product image. A product image alone is enough to trigger the full workflow. Also use it when the user asks for any of:

- a product video script
- a short-form ad storyboard
- image-to-video prompts
- first-frame images
- product usage scenes
- ecommerce creative variations
- "帮我用这个产品图做视频/分镜/素材"

If the user provides a product image without a detailed brief, infer a practical ecommerce direction from the image and proceed all the way to final generated videos. Do not pause to ask the user to choose a direction unless the product category is genuinely impossible to infer.

Prompts-only exceptions:

- If the user explicitly says `只要脚本`, `只要分镜`, `只要提示词`, `不要生图`, `不要视频`, or equivalent, stop at the requested planning/prompt stage.
- If media generation is blocked by missing config, missing credentials, tool failure, or policy/safety constraints, save all project files and clearly record the blocker in `references.json` and the final response.

## Output Directory Contract

All generated product-storyboard work for this workspace must be saved under the workspace root `product/` directory. This is mandatory.

Do not create new product-storyboard outputs under `剧本/generated_scripts/`, `outputs/`, `tmp/`, the skill directory, or `$CODEX_HOME`. Those locations may be used only as read-only source/reference libraries or transient generator defaults. Any generated asset that is needed by the product project must be copied into the product project folder before it is referenced in `script.md`, `prompts.json`, `references.json`, or `product/projects.json`.

Create one project folder per product run using the current local time and a readable product slug:

```text
product/YYYYMMDD_HHMMSS_product_slug/
```

Use the user's current locale/timezone when deriving the timestamp. The folder name must be stable for the run:

- `YYYYMMDD_HHMMSS`: local run start time, 24-hour clock.
- `product_slug`: short lowercase ASCII slug inferred from the product name/category, using underscores between words.
- If the user already selected or named an existing product project, use that folder instead of creating a duplicate.
- Do not rename the project folder after generation starts.

Required fixed project structure:

```text
product/
├── projects.json
└── YYYYMMDD_HHMMSS_product_slug/
    ├── 00_foundation_prompts.md
    ├── script.md
    ├── prompts.json
    ├── references.json
    ├── references/
    │   ├── product_reference_board.png
    │   ├── character_reference_sheet.png
    │   └── scene_reference_board.png
    ├── generated_media/
    │   ├── shot_01_first_frame.png
    │   ├── shot_01_video.mp4
    │   └── ...
```

Directory roles:

- `product/projects.json`: project-library index used by tools and skill workflows.
- `product/YYYYMMDD_HHMMSS_product_slug/`: the only writable project root for this product run.
- `00_foundation_prompts.md`: the three foundation-reference prompts, one each for product, character, and scene.
- `script.md`: product assumptions, matched references, core angle, storyboard table, generation prompts, and generated asset paths.
- `prompts.json`: structured reusable prompts for first-frame image generation and video generation.
- `references.json`: source image, generated reference paths, matched reference records, first-frame paths, video paths, and generated-media result metadata.
- `references/`: exactly the three foundation reference images, plus any explicitly requested extra reference variants only when needed.
- `generated_media/`: generated first-frame images and generated videos.

Path rules:

- Store all paths written to project JSON/Markdown as paths inside the project folder whenever possible.
- If an external URL or `$CODEX_HOME/generated_images/...` path is returned by a generator, copy/download the selected file into the fixed project structure first, then record the project-local path.
- Use deterministic media filenames: `shot_XX_first_frame.png` and `shot_XX_video.mp4`.
- Never reference a generated deliverable only from `$CODEX_HOME`, `剧本/generated_scripts/`, or another prior project.
- Existing `剧本/` files remain a retrieval library only; do not save new product deliverables there.

The foundation-reference phase controlled by the skill must produce actual image files:

1. `references/product_reference_board.png`
2. `references/character_reference_sheet.png`
3. `references/scene_reference_board.png`

After the foundation references exist, the skill must produce `script.md`, `prompts.json`, and `references.json`, then continue to generate first-frame images and videos by default, saving them under `generated_media/`.

## Required Workflow

1. Inspect the product image and extract visible facts:
   - product type, color, material, packaging, label text, likely use case
   - visual constraints that must be preserved
   - unclear details that should not be invented aggressively
   - target selling market and language from `.codex/skills/config/media_services.yaml` key `commerce_market`; if missing, default to the user's explicitly stated market
2. Create or select the product project directory under `product/YYYYMMDD_HHMMSS_product_slug/` and create `references/` and `generated_media/`.
   - Create the fixed files in that same project folder as the workflow reaches each stage.
   - Before writing any path into metadata, ensure the file exists under the project folder.
3. Generate exactly one product reference board through the active image-generation provider:
   - read `image_generation.provider` from `.codex/skills/config/media_services.yaml` before choosing the generator
   - if `image_generation.provider` is `flow2api`, the product reference board must be generated with Flow/flow2api, using the configured `flow2api.models.image_default`
   - use the built-in `image_gen` tool only when the active provider is not configured or when the configured provider is unavailable and the fallback is explicitly recorded
   - include product multi-view angles
   - include approximate product dimensions/scale using visual dimension markers, a ruler/grid, hand scale, or common-object scale
   - include product detail panels such as front label, cap/lid, side/back detail, texture/material, ingredient/benefit badge, included parts, capsules/accessories, or applicator depending on product type
   - include one realistic usage-context thumbnail only if it helps clarify scale or use
   - keep it as one image/canvas, not a set of separate outputs
   - preserve packaging/logo/shape as much as possible
   - save the final selected image as `references/product_reference_board.png` inside the product project folder
4. Generate exactly one character reference sheet with the image-generation skill:
   - target output path: `references/character_reference_sheet.png`
   - hard constraint: the character reference sheet must not show the user's product, product packaging, product logo, product label, product-colored stand-ins, or any product-shaped placeholder
   - create one primary creator/customer/hand-model identity suitable for the product and target market
   - include face front view, 45-degree view, side view, and half/body framing when relevant
   - include detailed hand reference: skin tone, hand shape, nail length/color, jewelry, sleeve cuff, and empty-hand grip poses that can later hold the product
   - include expression set: neutral, problem/pain-point concern, explaining/pointing, applying/using, satisfied result, CTA smile
   - include wardrobe, hairstyle, makeup, accessories, and body type
   - keep it as one reference sheet with the same person only
5. Generate exactly one multi-view scene reference board with the image-generation skill:
   - target output path: `references/scene_reference_board.png`
   - hard constraint: the scene reference board must not show the user's product, product packaging, product logo, product label, product-colored stand-ins, or any product-shaped placeholder
   - show the main real-shot location where the sequence will happen
   - include multiple camera views of the same scene: wide establishing view, counter/table action view, empty future product close-up zone, selfie/creator angle, and optional top-down layout view when useful
   - include stable lighting direction, counter/table layout, background objects, and an empty future product placement zone
   - make it practical and repeatable for every shot, not a decorative ad set
6. Save the product, character, and scene reference prompts to `00_foundation_prompts.md`. Do not show the internal generation prompts to the user by default unless the user asks.
7. If the active image-generation provider cannot be used in the current environment, state the blocker concisely instead of pretending the product reference was generated.
8. Record reference paths and prompt metadata in `references.json` with keys:
   - `product_reference_board`
   - `character_reference_sheet`
   - `scene_reference_board`
   - `commerce_market`
9. Query the local `剧本/` library for relevant references.
10. Adapt the matched references into an original storyboard for the user's product.
11. Save the storyboard and generation instructions to `script.md`, `prompts.json`, and `references.json` inside the product project folder.
12. For every storyboard shot, create:
   - shot goal
   - duration beat, normally 3-6 seconds for planning
   - final generation duration, default 8 seconds when unspecified
   - first-frame image prompt
   - video prompt with explicit duration
   - voiceover or on-screen text in the configured selling-market language if useful
   - edit note for how the user can trim or combine clips manually
13. Generate storyboard first-frame images through the active image-generation skill and save them as `generated_media/shot_XX_first_frame.png`, unless the user explicitly requested prompts/planning only.
14. Generate videos through the active video-generation skill from the generated first frames and save them as `generated_media/shot_XX_video.mp4`. Save video result metadata in `references.json`.
15. Refresh `product/projects.json` with final paths, asset counts, and project status.

Never ask the user to confirm the product direction before script retrieval unless the input image is ambiguous enough that proceeding would create the wrong product.

## Skill Media Generation

All image and video generation in this workflow is owned by Codex skills. Read service URL, API key, model aliases, concurrency limits, and commerce-market settings from `.codex/skills/config/media_services.yaml`; do not put real secrets in prompts or generated project files.

Image-provider selection applies to the entire workflow:

- `image_generation.provider` controls the product reference board, character reference sheet, scene reference board, and all storyboard first-frame images.
- When `image_generation.provider: "flow2api"`, the product reference board must use Flow/flow2api by default.
- Only fall back to `imagegen` when the configured provider is missing, blocked, or explicitly overridden by the user; record the fallback reason in `references.json`.

## Commerce Market and Language

Read `commerce_market` from `.codex/skills/config/media_services.yaml` before writing scripts, subtitles, voiceover, CTA copy, visible generated text, or audience assumptions.

Required behavior:

- `commerce_market.country` is the target selling country/market.
- `commerce_market.language` is the primary language for all user-facing script copy, voiceover, subtitle copy, CTA copy, offer copy, and platform-native wording.
- `commerce_market.locale`, `currency`, `currency_symbol`, and `platform_region` should guide price formatting, offer framing, local idioms, and CTA wording.
- If the product's packaging text is in a different language, preserve the original packaging text visually, but write spoken/scripted sales copy in the configured market language.
- Image/video prompts may remain in English for model control, but any quoted speech, subtitles, visible overlay text, or CTA text inside those prompts must be in `commerce_market.language`.
- Record the resolved `commerce_market` object in `references.json` and summarize the market/language in `script.md`.
- If `commerce_market.language` is Spanish for Mexico, use natural Mexican Spanish ecommerce phrasing, not generic Spain Spanish. Prefer CTA wording such as "toca el enlace", "aprovecha la promo", "envío a México", and price formatting with MXN when prices are known.

For media-generation concurrency:

- Character reference sheet and scene reference board can be generated after `references/product_reference_board.png` exists.
- When the active image-generation provider is Flow/flow2api, all independent image-generation jobs must be executed with multithreaded or async parallel processing, up to the configured shared concurrency limit. Do not run Flow image jobs one-by-one unless there is exactly one image job or a later image strictly depends on the previous image output.
- For Flow/flow2api, after `product_reference_board` exists, generate `character_reference_sheet` and `scene_reference_board` concurrently because neither may contain the product and neither depends on the other.
- Storyboard first-frame images must be generated in parallel batches when the active image-generation skill/API supports batching or parallel jobs.
- Storyboard videos should be generated in batches after their first frames exist when the active video-generation skill/API supports batching or parallel jobs.
- Respect the active provider's configured media-generation concurrency limit, unless the active skill specifies a stricter limit.
- Queue remaining jobs when the provider's concurrency pool is full.
- Do not run media jobs one-by-one unless there is only one job, a prior output is required, the concurrency pool is full, or the user explicitly requests sequential generation.

## Character Consistency

If any person, model, hand model, creator, actor, or customer appears in the storyboard:

1. Define a `Character Identity Lock` before the storyboard:
   - age range, gender presentation, ethnicity/skin tone when visible, face shape, hairstyle, hair color, body type, wardrobe, accessories, makeup style, and overall vibe
   - stable camera-visible details such as nail color, sleeve color, jewelry, glasses, tattoos, or facial hair
2. Generate and save `character_reference_sheet` before storyboard first-frame generation.
3. Reuse the same identity lock in every first-frame prompt and every video prompt that includes a person.
4. Keep wardrobe, hairstyle, makeup, accessories, and hand appearance consistent unless a shot explicitly requires a change.
5. If using image-generation or video-generation systems that support reference images, instruct the model to use the product reference board, character reference sheet, and scene reference board together.
6. Do not introduce a different person between shots. If multiple people are truly needed, ask the user first; default to one person only.
7. Do not generate second-person hands, extra hands, background people, mirror reflections of another person, assistants, customers, or bystanders unless explicitly requested.
8. For hand-only shots, still use the same character reference sheet: skin tone, hand shape, nail length/color, jewelry, sleeve, and grip style must match the creator.
9. When both hands appear, explicitly describe left hand and right hand roles in prompts. Do not allow two left hands, two right hands, duplicated thumbs, mirrored same-side hands, or swapped hand orientation.
10. When a hand holds or touches the product, require realistic occlusion, finger wrapping, contact shadows, and product thickness so the product reads as a real 3D object rather than a flat printed sticker.

## Product Reference Board Prompt

Use this prompt through the active image-generation provider for the first generated image. Do not display this internal prompt to the user unless explicitly asked for prompts:

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

## Character Reference Sheet Prompt

Use this prompt through the active image-generation skill and save the selected output to `references/character_reference_sheet.png`. Also write the prompt to `prompts.json` / `00_foundation_prompts.md`:

```text
Create one single vertical 9:16 character reference sheet for a real-shot ecommerce UGC creator who will appear in all later product storyboard images and videos.

Product context: [product category and target market inferred from product image].
Character role: one creator/customer/hand model only. The character must look like a real person filmed in a phone-camera UGC video, not a model in a polished ad campaign.
Hard product exclusion: do not include the user's product, product packaging, product logo, product label, product-colored stand-ins, or any product-shaped placeholder anywhere in this character reference sheet. This sheet defines only the person, hands, expressions, wardrobe, and empty-hand poses.

Required sections in one reference sheet:
1. Face identity: front view, 45-degree view, side view, and natural selfie framing. Keep the exact same person across all views.
2. Expression set: neutral, concerned/problem reaction, explaining to camera, applying/using product, satisfied result, and CTA smile.
3. Hand detail: both hands visible in close-up, skin tone, hand shape, nail length/color, rings/bracelets if any, sleeve cuff, and natural empty-hand grip poses that can later hold a product.
4. Wardrobe and styling: hair length/style/color, makeup, earrings/accessories, top/jacket, and body framing.
5. Continuity notes visually implied: same person, same hands, same wardrobe, same hair, same makeup, no alternate actor.

Style: photorealistic real-shot UGC reference sheet, practical natural light, clean neutral background, high detail in face and hands, no beauty-ad retouching.

Avoid: the product, product packaging, product labels, product-colored props, product-shaped placeholders, a second person, extra hands, mismatched hands, two left hands, two right hands, duplicated thumbs, wrong-side thumbs, mirrored duplicate hands, different hairstyles, different outfits, distorted fingers, exaggerated expressions, fashion editorial lighting, studio ad styling, fake text labels, or background bystanders.
```

Use `references/character_reference_sheet.png` for every first-frame image that includes a face, body, or hands.

## Multi-View Scene Reference Board Prompt

Use this prompt through the active image-generation skill and save the selected output to `references/scene_reference_board.png`. Also write the prompt to `prompts.json` / `00_foundation_prompts.md`. Generate a multi-view scene reference board, not a single isolated room photo:

```text
Create one single vertical 9:16 real-shot multi-view scene reference board for the product storyboard.

Scene purpose: a consistent location where all shots can plausibly happen in one continuous UGC filming session.
Product context: [product category and natural usage location].
Hard product exclusion: do not include the user's product, product packaging, product logo, product label, product-colored stand-ins, or any product-shaped placeholder anywhere in this scene reference board. The board defines only the reusable location, surfaces, lighting, camera angles, background objects, and empty zones where the product can later be placed.

Required scene details:
1. Main location: [bathroom vanity / kitchen table / bedroom mirror / car seat / desk / gym bag / other location inferred from product].
2. Multi-view scene panels in the same board:
   - wide establishing view of the whole usable location
   - empty future product placement view showing the clear surface where the product can later sit, without the product present
   - hand/action close-up view showing the empty surface where use or texture shots can later happen
   - selfie/creator camera view showing where a person can stand or sit
   - optional top-down layout map if it helps maintain continuity
3. Stable layout: empty future product placement zone, hand/action zone, mirror/counter/table position, and 3-5 simple background objects that should remain consistent.
4. Lighting: practical real room light direction, time of day, shadow behavior, and color temperature.
5. Camera logic: where a phone camera or hand-held camera would naturally be placed for each view.
6. Continuity: the scene must support all storyboard shots without changing rooms unless the script requires a clear transition.

Style: photorealistic real-shot UGC environment, ordinary lived-in but clean, practical natural light, not a commercial studio set.

Avoid: the product, product packaging, product labels, product-colored props, product-shaped placeholders, extra people, second-person hands, ad props, floating product displays, poster composition, dramatic commercial lighting, unrelated decor, mismatched rooms between panels, inconsistent lighting between panels, or backgrounds that cannot be repeated across shots.
```

Use `references/scene_reference_board.png` for every first-frame image to keep the environment consistent.

## Script Retrieval

After `product_reference_board`, `character_reference_sheet`, and `scene_reference_board` are generated, use the `commerce-script-retrieval` workflow if available. Otherwise, search these local files directly:

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

1. Product project folder under `product/YYYYMMDD_HHMMSS_product_slug/`
2. Product assumptions
3. Matched reference videos
4. Core selling angle
5. Storyboard table
6. Asset-generation prompts
7. Generated reference paths/URLs:
   - `product_reference_board`
   - `character_reference_sheet`
   - `scene_reference_board`
8. Generated media paths:
   - per-shot first-frame image path
   - per-shot video path
   - edit/trim note from the storyboard plan

Use this table shape for the storyboard:

| 镜头 | 规划时长 | 生成时长 | 画面 | 口播/字幕 | 首帧图提示词 | 视频提示词 | 剪辑备注 |
|---|---:|---:|---|---|---|---|---|
| 1 | 4s | 8s | ... | ... | ... | ... | ... |

Rules:

- `规划时长` can be 3-6 seconds by default.
- `生成时长` defaults to 8 seconds if the user has not explicitly marked another duration.
- Use the 8-second video model by default. If the beat is shorter than 8 seconds, still generate 8 seconds and add an edit note for where to trim.
- Write prompts in English for image/video models unless the visible text or voiceover must be Chinese.
- Write all user-facing sales copy, voiceover, subtitle copy, CTA copy, and visible overlay text in the configured `commerce_market.language`; do not default to Chinese or English unless that is the configured market language or the user explicitly overrides it.
- Keep each video prompt to one clear physical beat.
- If a product label or text must appear, quote exact text and warn about text-rendering risk.
- For first-frame prompts, describe a static real-shot UGC frame.
- Generate first-frame images by default in the skill with `product_reference_board`, `character_reference_sheet`, and `scene_reference_board` as primary references.
- If the user explicitly requested prompts/planning only, do not generate media, but still write first-frame prompts that explicitly reference those three foundation images.
- First-frame images must be generated in parallel batches with up to 5 in-flight jobs when the active image-generation skill/API supports it; with Flow/flow2api this is mandatory for independent first-frame jobs.
- When exact packaging matters, also attach the original product image, with the board used for scale/detail guidance and the original used for packaging fidelity.
- For video prompts, describe motion from that first frame over the chosen duration.
- Make the full video sequence coherent: every shot should feel like it happened in the same real shoot, with a logical before/after relationship to the neighboring shots.
- Keep continuity across shots: same product state, same room or compatible adjacent room, same lighting direction, same person/hand identity, same wardrobe, and plausible hand/object position changes.
- Avoid second-person hands and extra people. If the shot needs a hand, it must be the same creator's hand from `character_reference_sheet`.
- Avoid impossible same-side hand anatomy: no two left hands, no two right hands, no duplicated thumbs, no wrong-side thumbs, no mirrored copies of the same hand. For hand shots, specify which hand is left and which is right, and make thumb positions anatomically plausible.
- Avoid flat product rendering: the product must have real 3D volume, visible thickness, perspective, material highlights, realistic contact shadows, and proper occlusion by fingers or surfaces. Do not let packaging look like a printed 2D sticker, paper cutout, flat app icon, or pasted label.
- Prefer real-shot UGC footage language over advertising language: handheld phone camera, practical room light, natural counter/bathroom/kitchen setting, ordinary human handling, realistic imperfections, no studio hero ad look.
- Avoid disconnected scene jumps, poster-style product compositions, cinematic ad lighting, floating UI, fake glow effects, exaggerated hero orbits, and overly polished commercial packshots unless the user explicitly asks for ads.
- When a person appears, include the exact `Character Identity Lock` in the prompt or reference it explicitly by label.
- Add edit notes such as "use full 5-second clip", "trim after product contact", "use middle 3 seconds as transition", or "cut on reaction moment".

## Prompt Standards

First-frame image prompt:

```text
Create a vertical 9:16 photorealistic first frame for a real-shot UGC ecommerce video. The product is [product], preserving [key appearance]. Character Identity Lock if a person appears: [same stable character description across every shot]. Continuity: this frame should logically follow [previous shot state] and lead into [next shot state]. Composition: [shot framing]. Action state: [frozen moment]. Scene: [real home/bathroom/kitchen/counter setting]. Lighting: [practical natural room light]. Leave clean space for optional subtitles. No distorted hands, no changed packaging, no extra logos, no different actor from other shots, no polished studio ad look.
```

When the image-generation skill/API creates first frames, attach or reference `product_reference_board`, `character_reference_sheet`, and `scene_reference_board` whenever the tool supports references. If exact packaging matters, also attach the original product image. Prompts should include:

```text
Use the attached product reference board for product scale, packaging details, close-up features, and handling. Use the attached character reference sheet for the exact same face, hands, hair, wardrobe, expressions, manicure, jewelry, and body identity. Use the attached multi-view scene reference board for the same location, lighting direction, counter/table layout, background objects, product placement zone, action zone, and camera angles. Preserve one person only. Do not add second-person hands, background people, assistants, bystanders, or extra hands. Hands must be anatomically correct: no two left hands, no two right hands, no duplicated thumbs, no wrong-side thumbs, no mirrored same-side hand copies. The product must read as a real 3D object with volume, thickness, highlights, perspective, contact shadows, and natural finger occlusion; it must not look like a flat 2D sticker, paper cutout, or pasted label.
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

## Media Generation Completion

Do not run automatic first-frame image QA or generated-video QA in this workflow. After first-frame images and videos are generated, save the asset paths, generation prompts, provider metadata, and any generator result URLs or IDs to `script.md`, `prompts.json`, `references.json`, and `product/projects.json`.

If the user explicitly asks for QA in a later message, treat that as a separate task and follow the user's requested review method for that turn.

## User-Facing Behavior

When a product image is provided, do not first ask for market direction and do not print internal generation prompts unless the user requests them. Run the full workflow to final assets by default. Do the work in this order:

1. Create or select the product project folder under `product/YYYYMMDD_HHMMSS_product_slug/`.
2. Generate one product reference board with the active image-generation provider and save it as `references/product_reference_board.png`.
3. Generate the character reference sheet and scene reference board with the active image-generation provider. They must not contain the product or product-like placeholders; when using Flow/flow2api, generate them concurrently.
4. Save the foundation prompts as `00_foundation_prompts.md`.
5. Continue to retrieval-backed storyboard creation.
6. Save storyboard and structured generation instructions as `script.md`, `prompts.json`, and `references.json`.
7. Generate all storyboard first-frame images through the active image-generation skill, using parallel batches when supported and mandatory parallel execution for Flow/flow2api. Save them under `generated_media/`.
8. Generate all storyboard videos through the active video-generation skill from the generated first frames and save them under `generated_media/`.
9. Update `references.json` and `product/projects.json` with final paths, provider metadata, asset counts, and project status.
10. Tell the user the product project folder, generated first-frame paths, final video paths, and storyboard edit notes.
