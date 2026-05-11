---
name: nanobanana2-image-prompting
description: Use this skill to write, refine, audit, or teach Google Nano Banana 2 prompts for image generation and editing, including Gemini 3.1 Flash Image Preview, product photography, ecommerce ads, posters, infographics, text-in-image, character consistency, multi-reference composition, conversational edits, style transfer, and API-oriented prompt packs.
---

# Nano Banana 2 Image Prompting

Use this skill when the user wants Nano Banana 2 prompts, image-generation templates, image-editing prompts, product visuals, ecommerce creatives, brand assets, posters, infographics, character sheets, multi-image blending, or troubleshooting for Gemini image generation.

## Current Model Facts

As of 2026-05-07:

- Nano Banana 2 is officially `Gemini 3.1 Flash Image Preview`; read the workspace model code from `google_prompting.nano_banana2.official_model` in `.codex/skills/config/media_services.yaml`.
- It is the high-efficiency image generation and editing counterpart to Nano Banana Pro / Gemini 3 Pro Image, optimized for speed, cost, and high-volume workflows.
- Inputs: text plus image/PDF. Outputs: image and text. Audio/video inputs are not supported.
- Supports image generation, conversational editing, Search grounding, image search grounding, thinking, Batch API, and SynthID watermarking.
- New output sizes include 512, 1K, 2K, and 4K. Default is 1K.
- Supported aspect ratios include `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, and `21:9`.
- It supports multi-image workflows. Official Gemini API docs describe the configured Nano Banana 2 model as supporting character resemblance of up to 4 characters and fidelity of up to 10 objects in a single workflow. Do not promise 14 high-fidelity inputs unless the current surface explicitly documents it.
- For best performance, Google lists EN and several other languages including `zh-CN`; write final prompts in English by default unless Chinese text, localization, or user preference matters.
- If exact current availability, pricing, model status, or API syntax matters, verify official docs because this is a preview model.

## Core Principle

Write a descriptive creative brief, not a tag list.

Bad:

```text
product photo, mug, black, studio, realistic, 4k
```

Better:

```text
A high-resolution studio product photograph of a matte black ceramic coffee mug on a polished concrete surface. The mug is centered in a square composition, shot from a slightly elevated 45-degree angle to show the rim and handle. Use a three-point softbox lighting setup with soft highlights, realistic contact shadows, and sharp focus on the ceramic texture.
```

## Prompt Anatomy

Use only the fields that matter for the job:

1. Intent: what the image is for, such as ecommerce hero, social ad, infographic, package mockup, avatar, storyboard, UI mockup.
2. Subject: exact product/person/object, with stable visual traits.
3. Composition: framing, crop, orientation, negative space, object placement.
4. Action/state: what is happening or what changed.
5. Environment: location, background, surface, props, time, atmosphere.
6. Style: photorealistic, editorial, 3D icon, watercolor, sticker, technical diagram, luxury ad, UGC snapshot.
7. Camera: shot type, angle, lens, depth of field, focal point.
8. Lighting: source, direction, softness, shadow, reflection behavior.
9. Materials: glass, matte plastic, ribbed cotton, polished metal, translucent gel, leather grain, ceramic glaze.
10. Text: exact words, placement, hierarchy, font style, language, spelling constraints.
11. Preservation: what must remain unchanged when editing.
12. Output: aspect ratio, resolution, number of variations if the interface supports it.
13. Semantic negatives: positive constraints and specific exclusions.

## Default Workflow

1. Identify the mode: text-to-image, image edit, multi-reference composite, text-in-image, infographic, character consistency, or product batch.
2. Ask for or infer platform constraints: aspect ratio, resolution, target channel, brand style, language, and whether existing images must be preserved.
3. Draft the prompt as a short creative brief with subject, composition, action/state, context, style, camera, lighting, and output format.
4. For edits, say exactly what to change and exactly what to keep unchanged.
5. For multi-reference work, assign each input image a role before describing the output.
6. For text-heavy images, finalize the copy first, then prompt for image layout using that exact text.
7. Use 512 or 1K for rapid exploration; use 2K/4K for final assets.
8. Iterate with small follow-up edits rather than rewriting the whole prompt after a near miss.

## API Notes

When writing prompts for Gemini API or Vertex AI:

- Use `google_prompting.nano_banana2.official_model` from `.codex/skills/config/media_services.yaml` for Nano Banana 2.
- Use `response_modalities=['Image']` / `responseModalities: ['Image']` when only images should return.
- Use `image_config.aspect_ratio` and `image_config.image_size` instead of relying only on prompt wording when API supports it.
- Use 512/1K for draft and high-volume variants; use 2K/4K for final assets.
- Use higher thinking / dynamic thinking only for complex compositions, exact text, product constraints, or factual diagrams; default/minimal is better for fast iteration.
- Remember generated images include SynthID watermarking.

## Prompt Order

For production prompts, use this order:

```text
Purpose -> canvas/aspect ratio -> subject -> composition -> environment -> lighting -> camera -> style/materials -> text -> preservation -> constraints
```

Template:

```text
Create a [purpose] image in [aspect ratio/resolution].
Subject: [specific product/person/object and stable traits].
Composition: [framing, placement, crop, negative space].
Scene: [location, background, surface, props].
Lighting: [source, direction, softness, reflections, shadows].
Camera/style: [lens, angle, realism/art style, detail level].
Text: [exact text, placement, font style, language], or no text.
Preserve: [identity/logo/product shape/face/composition].
Constraints: [semantic negative instructions and exclusions].
```

## JSON-Style Prompt

Use a JSON-like prompt when a scene has many constraints, repeated variants, or exact product/brand requirements.

```json
{
  "purpose": "premium ecommerce hero image",
  "aspect_ratio": "4:5",
  "resolution": "2K",
  "subject": "the exact skincare serum bottle from reference image 1, frosted glass, white pump, silver label edge",
  "composition": "bottle centered slightly above midpoint, 20 percent clean negative space at top for headline",
  "scene": "travertine stone pedestal with one soft linen fold and two water droplets near the base",
  "lighting": "large diffused window light from upper left, soft contact shadow, gentle rim highlight on glass",
  "camera": "85mm product photography lens, slightly elevated front angle, sharp focus on bottle label",
  "style": "photorealistic luxury beauty ad, clean neutral palette, realistic material texture",
  "text": "no text in the image",
  "preserve": "keep bottle shape, pump, label proportions, and brand logo unchanged",
  "avoid": "no extra bottles, no distorted logo, no harsh reflections, no cluttered background"
}
```

JSON does not create a formal schema inside the image model. It helps because it separates constraints clearly.

## Text-To-Image Templates

### Photoreal Product Shot

```text
Create a [aspect ratio] high-resolution studio product photograph of [product] on [surface]. The product is [placement/framing] with [key feature] clearly visible. Use [lighting setup] to create [shadow/reflection behavior]. Shot from [camera angle] with [lens/focus]. Style: photorealistic commercial photography, crisp material detail, realistic scale and contact shadows. No text unless specified.
```

### Ecommerce Hero With Negative Space

```text
Create a [platform] ecommerce hero image for [product/category]. Place [product] in [area of frame], leaving clean negative space on [side/top] for ad copy. Background: [simple environment or surface]. Lighting: [source and mood]. Camera: [angle/lens]. Style: [brand style]. Avoid clutter, extra products, unreadable labels, and distorted proportions.
```

### Social Ad Poster With Text

```text
Create a [9:16/4:5/1:1] social media ad poster for [product/offer].
Headline text exactly: "[headline]".
Secondary text exactly: "[supporting copy]".
CTA text exactly: "[CTA]".
Use [font style description], clear hierarchy, high contrast, generous spacing, and safe margins. Product appears [placement]. Background: [scene]. Style: [brand look]. Ensure every word is spelled correctly and no extra text appears.
```

### Infographic / Diagram

```text
Create a clean [aspect ratio] infographic explaining [topic] for [audience]. Use [number] labeled sections with simple icons, clear arrows, and concise text. Title exactly: "[title]". Include only these labels: [label list]. Use accurate factual details, a restrained color palette, and generous spacing. Avoid decorative clutter, tiny unreadable text, and extra labels.
```

### Sticker / Icon / Asset

```text
Create a [style] sticker/icon of [subject]. Use bold clean outlines, simple readable shapes, [color palette], and a plain white background. Center the asset with enough margin. No text. Do not use transparent background.
```

## Image Editing Rules

For edits, be direct and localized:

```text
Using the provided image, change only [target area/object] to [new state]. Keep [identity/composition/background/lighting/perspective/other objects] unchanged. Match the original style, camera perspective, material texture, and lighting.
```

Strong preservation phrases:

- `Keep everything else unchanged.`
- `Preserve the original camera angle, crop, perspective, and lighting.`
- `Preserve the person's face, expression, hairstyle, skin tone, and body proportions.`
- `Preserve the product silhouette, logo placement, label proportions, and packaging shape.`
- `The new object should look physically present in the original scene, with matching shadows and reflections.`

Avoid broad edit prompts like `make it better`, `beautify it`, or `make it luxury`. Say what should change.

## Semantic Masking / Inpainting

Nano Banana 2 can follow conversational masks. Define the region semantically:

```text
Using the provided image, edit only the [blue sofa / shirt logo area / background wall / object on the left]. Replace it with [desired replacement]. Keep all other areas exactly the same, including [important unchanged items]. Match the original lighting, shadows, perspective, and texture.
```

If the edit leaks into other areas, retry with a narrower target and stronger preservation instructions.

## Multi-Reference Composition

Assign each reference image a clear role:

```text
Use reference image 1 for the exact product identity and logo.
Use reference image 2 for the model's pose and body proportions.
Use reference image 3 for the lighting and color grade only.
Use reference image 4 for the background environment.
Create [final image]. Preserve [critical traits]. Do not copy unrelated objects from reference image 3.
```

Rules:

- Put the most important identity reference first.
- Separate object, character, scene, and style references.
- Tell the model what not to transfer from each reference.
- For products, use clean packshots; for people/characters, use clear face and full-body references when possible.
- For many references, list roles in bullet-like sentences instead of one dense paragraph.

## Character Consistency

For recurring characters:

1. Create or choose a clean anchor image.
2. Write a character bible: face, hair, body, outfit, colors, accessories, silhouette, personality.
3. Reuse the anchor image plus the character bible.
4. Change one variable at a time: angle, expression, outfit, location, action.
5. Include previous accepted outputs when generating new angles or a 360 view.

Template:

```text
Using the provided character reference, create a [shot type] of the same character in [new pose/location]. Preserve identity: [face shape], [hair], [eye color], [skin tone], [signature outfit/accessory], [silhouette]. Change only [pose/expression/background]. Match [style]. Avoid changing facial structure, age, hairstyle, body proportions, or signature colors.
```

For group scenes, explicitly state `only one of each character` and list all characters with unique traits.

## Text Rendering And Localization

Nano Banana 2 is stronger at text than older image models, but text still needs discipline.

Best workflow:

1. Finalize the exact text outside the image prompt.
2. Keep copy short.
3. Specify hierarchy and placement.
4. Ask for no extra text.
5. If translating/localizing, say whether visuals should localize too.

Template:

```text
Create a [asset type] with exactly this text:
Headline: "[text]"
Subheadline: "[text]"
CTA: "[text]"
Place the headline at [position], subheadline below it, CTA in [button/badge/location]. Use [font style], high contrast, and readable spacing. Do not add, remove, translate, or misspell any words. No other text.
```

For factual or text-heavy images, consider using Search grounding and cite/check the source information in the surrounding workflow.

## Search Grounding

Use Search grounding for current, factual, or real-world visual context:

- Current events, weather, sports, finance, recent product/category trends.
- Accurate landmarks, animals, plants, maps, diagrams, real-world objects.
- Localized posters and infographics that need factual context.

Prompt pattern:

```text
Use Google Search and Image Search grounding to verify [topic]. Create a [asset type] showing [visual goal]. Use accurate visual references for [specific subject], but do not include source-page watermarks or unrelated text. Include only these labels: [labels].
```

Important: when using Image Search grounding in an app, provide source attribution links as required by Google. Gemini 3.1 Flash Image Preview does not support using real-world images of people from web search at this time.

## Aspect Ratio Guide

- `1:1`: marketplace thumbnails, profile images, icons, product squares.
- `4:5`: Instagram feed, fashion/editorial, ecommerce hero.
- `9:16`: TikTok, Reels, Shorts, Stories, vertical posters.
- `16:9`: web banners, YouTube thumbnails, presentations, landscape scenes.
- `21:9`: cinematic banners, wide hero backgrounds.
- `3:2`: photography, editorial web images.
- `2:3` or `3:4`: posters, portrait products, book covers.
- `4:1` / `8:1`: panoramic banners, website mastheads.
- `1:4` / `1:8`: vertical strips, app splash/banner variants.

Always put aspect ratio near the beginning for layout-sensitive tasks.

## Product And Ecommerce Recipes

### Clean Packshot

```text
Create a clean ecommerce packshot of [product] on a pure white background. The product is centered, front-facing, evenly lit, with realistic shadow directly below it. Preserve exact shape, label proportions, and material texture. No props, no hands, no extra text, no distorted logo.
```

### Luxury Beauty / Skincare

```text
Create a 4:5 luxury beauty product photograph of [product] on [stone/glass/linen surface]. Add [one or two props] that support the product story without clutter. Use soft diffused window light from upper left, subtle caustic reflections, realistic contact shadows, and crisp glass/plastic texture. Leave negative space for headline. No extra bottles, no fake labels, no warped packaging.
```

### UGC Before/After Thumbnail

```text
Create a 9:16 UGC-style social ad image for [product]. Split the composition into a subtle before/after layout: left shows [specific problem], right shows [specific improved state]. Keep it realistic, not exaggerated. Include product in the lower third. Add exact headline text: "[short headline]". Natural phone-camera lighting, authentic home setting, readable text, no extra claims.
```

### Marketplace Lifestyle Scene

```text
Create a realistic lifestyle product photo of [product] being used by [target customer] in [environment]. The product is the visual focus, shown at realistic scale with natural hand contact and matching shadows. Camera: [35mm/50mm/lens], [angle]. Lighting: [source]. Style: clean ecommerce lifestyle, trustworthy, not overly polished.
```

### Product On Model

```text
Use reference image 1 for the exact product. Use reference image 2 for the model identity and pose. Create a realistic ecommerce fashion image where the model wears/holds the product naturally. Adjust lighting and shadows so the product belongs in the scene. Preserve the model's face and body proportions and preserve the product's design, logo, color, and scale.
```

### Product Variant Batch

Use this when the user wants many ad directions from one product:

```text
Create 4 distinct ecommerce creative directions for the exact product from reference image 1. Keep product shape, logo, color, and packaging proportions unchanged in every image.
Variation 1: clean studio packshot on white.
Variation 2: premium lifestyle scene in [environment].
Variation 3: macro detail shot emphasizing [feature/material].
Variation 4: social ad layout with negative space for headline.
Use the same brand mood across all variations: [brand mood]. No extra products, no distorted label, no unreadable text.
```

### Chinese Social Commerce Poster

```text
Create a 9:16 Chinese social commerce poster for [product]. Product is placed in the lower third, large and clear. Use a clean premium layout with safe margins and strong visual hierarchy.
Headline text exactly: "[Chinese headline]".
Selling point text exactly: "[short Chinese selling point]".
CTA text exactly: "[Chinese CTA]".
Use modern Simplified Chinese typography, high contrast, and no extra text. Preserve the product logo and packaging shape from reference image 1.
```

### Texture Proof Close-Up

```text
Create a macro ecommerce proof image showing [product feature] in extreme close-up. The image should clearly show [texture/material effect: fabric weave, serum viscosity, silicone grip, metal brushing, leather grain]. Use realistic side lighting, sharp focus on the texture, shallow depth of field, and natural scale cues from [finger/coin/drop/surface]. No text, no extra objects, no unrealistic smoothing.
```

### Packaging Mockup

```text
Create a realistic packaging mockup for [product category]. Package shape: [box/bottle/pouch/tube]. Front label text exactly: "[brand/product text]". Visual style: [minimal/luxury/playful/natural/scientific]. Show the package at a three-quarter angle on [surface], with realistic material, folds/edges, shadows, and print alignment. No misspellings, no extra labels, no warped typography.
```

### Background Replacement

```text
Using the provided product image, replace only the background with [new environment]. Keep the product exactly unchanged: same shape, logo, label, color, angle, and crop. Match the new scene's lighting with believable contact shadows/reflections under the product. Do not add props touching the product unless specified.
```

### Style Transfer With Structure Preservation

```text
Transform the provided image into [target style]. Preserve the original composition, subject placement, pose, object count, and major shapes. Change only the rendering style, color palette, and surface treatment. Keep important text/logos readable and unchanged unless asked to restyle them.
```

## Brand And Design Assets

For brand visuals, specify brand attributes rather than vague taste words.

```text
Create a [asset] for a [brand category] brand with these attributes: [premium/playful/minimal/scientific/natural]. Use [color palette], [typography style], [composition style], and [visual motif]. The design should feel [audience/context]. Include exact text: "[text]". Avoid generic stock imagery, extra slogans, and unreadable small text.
```

When preserving brand identity from a reference, say:

```text
Preserve the logo geometry, spacing, color, and proportions. Do not redraw or reinterpret the logo. Integrate it naturally onto [surface] with realistic perspective, fabric folds/reflections, and lighting.
```

## Camera, Lighting, Material Vocabulary

Camera:

- `macro product shot`, `slightly elevated 45-degree angle`, `front-facing packshot`, `top-down flat lay`, `low-angle hero shot`, `wide environmental shot`, `85mm portrait lens`, `50mm lifestyle lens`, `shallow depth of field`, `rack-focus style composition`.

Lighting:

- `three-point softbox setup`, `large diffused window light`, `golden hour backlight`, `high-key beauty lighting`, `low-key dramatic side light`, `soft rim highlight`, `controlled glossy reflections`, `realistic contact shadows`, `overcast daylight`.

Materials:

- `matte plastic`, `frosted glass`, `brushed metal`, `glossy ceramic`, `translucent gel`, `ribbed cotton`, `woven canvas`, `polished leather`, `silicone grip`, `velvet fabric`, `marble veining`, `travertine stone`, `water droplets`, `fine skin texture`.

Style:

- `photorealistic commercial photography`, `editorial fashion`, `premium skincare ad`, `minimalist Japanese packaging`, `clean SaaS UI mockup`, `kawaii sticker`, `technical diagram`, `comic storyboard`, `museum catalog photography`, `1990s product photography`, `Apple-style product layout`.

## Semantic Negatives

Google recommends semantic negative prompting: describe the desired condition positively when possible.

Instead of:

```text
No cars.
```

Use:

```text
An empty, quiet residential street with no signs of traffic, parked vehicles, headlights, or road congestion.
```

Useful constraints:

- `clean background with only the product and one prop`
- `no extra text, no subtitles, no watermark`
- `preserve exact logo shape and placement`
- `realistic human hands with correct fingers`
- `single product only, no duplicates`
- `no clutter, no harsh reflections, no overexposed highlights`
- `readable text with safe margins and no misspellings`

## Iteration Strategy

When output is close:

- Use conversational edits: `Keep everything the same, but make the lighting warmer.`
- Change one variable at a time: composition, lighting, background, text, or product angle.
- For persistent logo/text issues, simplify the image, increase space, reduce text length, and use a cleaner reference.
- For product realism, add scale cues, contact shadows, and material-specific reflections.
- For character drift, reuse the anchor image and reduce changes to pose or environment.
- For too-generic images, add intent, target audience, materials, camera angle, and one distinctive detail.

## Quality Checklist

Before finalizing a prompt:

- Is the mode clear: generate, edit, combine, localize, or iterate?
- Is the prompt a descriptive brief instead of disconnected tags?
- Is aspect ratio near the beginning?
- Are subject, composition, environment, lighting, camera, style, and materials specified?
- For edits, are change and preserve instructions both explicit?
- For multi-image work, does each reference have a role?
- For text, are exact words, hierarchy, font style, and no-extra-text constraints included?
- For ecommerce, is there one clear purchase-driving proof?
- Are negatives specific and not overloaded?
- Is final resolution appropriate: 512/1K for draft, 2K/4K for final?

## Common Failure Fixes

- Logo/text distorted: use a clean reference, shorten copy, specify exact placement, add `no extra text`, and generate final at higher resolution.
- Product shape changes: describe immutable shape, silhouette, label, material, and scale; ask to preserve reference image 1.
- Too much clutter: require one product, one surface, one prop, and negative space.
- Looks like AI render: add real camera/lens, contact shadows, surface imperfections, material-specific reflections, and realistic scale.
- Edit affects wrong area: use semantic masking and repeat `change only... keep everything else unchanged`.
- Character drift: reuse accepted image, list identity traits, reduce environment/outfit changes.
- Wrong aspect ratio: state aspect ratio first and use API `image_config.aspect_ratio` if available.
- Text too small: reduce amount of text, increase safe margins, request bold readable hierarchy.
- Inaccurate factual image: use Search grounding and verify sources.

## Source Links

- Google AI for Developers, Nano Banana image generation: https://ai.google.dev/gemini-api/docs/image-generation
- Google AI model page for the configured Nano Banana 2 model.
- Google blog, Build with Nano Banana 2: https://blog.google/innovation-and-ai/technology/developers-tools/build-with-nano-banana-2/
- Google blog, Nano Banana 2 latest image model: https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/
- Google blog, Nano Banana Pro prompting tips: https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/
- Supplementary practical references: Stratboost product-image guide, ImagineArt prompt examples, Fliki no-fluff prompting guide, Invideo Nano Banana 2 guide, TechRadar prompt tests.
