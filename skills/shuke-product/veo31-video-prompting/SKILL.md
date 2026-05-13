---
name: veo31-video-prompting
description: Use this skill to write, refine, audit, or teach Google Veo 3.1 video prompts, especially for short-form ads, product demos, UGC-style ecommerce videos, image-to-video, first-and-last-frame transitions, and prompt packs for Gemini API, Vertex AI, Gemini app, or Flow.
---

# Veo 3.1 Video Prompting

Use this skill when the user wants Veo 3.1 prompts, prompt templates, prompt diagnosis, short-video scripts, product showcase clips, image-to-video motion prompts, or a repeatable workflow for Google video generation.

## Current Model Facts

As of 2026-05-07, prefer these current Google references:

- Vertex AI model page: read the workspace list from `google_prompting.veo31.vertex_ai_models` in `../config/media_services.yaml`.
- Prompt language is English. Think in the user's language if helpful, but produce final Veo prompts in English unless the user explicitly asks otherwise.
- Standard Veo 3.1 clips are 4, 6, or 8 seconds, 24 FPS, MP4, 16:9 or 9:16, up to 4 outputs per request.
- Use 9:16 for TikTok, Reels, Shorts, Xiaohongshu/Douyin-style vertical video; use 16:9 for YouTube, web, TV, landscapes, or wide product context.
- Veo 3.1 supports text-to-video, image-to-video, prompt rewriting, first-and-last-frame generation, reference asset images, extending videos, Content Credentials, and stronger audiovisual output. Exact availability can vary by Gemini API, Vertex AI, Flow, Gemini app, and preview/GA status.
- Google docs are the source of truth for limits and feature availability; verify if the user asks for API implementation or current pricing/availability.

Workspace default: use 8-second video prompts and 8-second model aliases unless the user explicitly marks a different duration. If no duration is provided, write `Format: 8 seconds`.

## Prompt Anatomy

Build prompts from these elements, using only the elements that matter for the clip:

1. Subject: who or what the shot is about.
2. Context: location, background, situation, era, product category, brand-safe details.
3. Action: what changes during the short clip.
4. Style: cinematic, UGC, photorealistic, product macro, anime, stop-motion, documentary, etc.
5. Camera motion: dolly in, slow push-in, handheld follow, tracking shot, drone rise, static locked-off, orbit, top-down, macro rack focus.
6. Composition: close-up, medium shot, wide shot, over-the-shoulder, centered product hero, extreme macro.
7. Ambiance: light, color, weather, texture, mood, atmosphere.
8. Temporal behavior: slow motion, time-lapse, subtle evolution, rhythmic movement.
9. Audio: separate sentence for dialogue, ambient sound, sound effects, music, and voice style.

Keep short clips focused on one scene and one main transformation. For multiple beats, create multiple clips instead of stuffing a whole story into one generation.

For the user's ecommerce production workflow, default to realistic live-action footage instead of polished advertising:

- Use real-shot UGC phone footage, practical light, natural handheld movement, ordinary room ambience, and plausible human handling.
- Keep storyboard shots connected as one continuous shoot: same product state, same person/hand identity, same wardrobe, same location logic, and consistent lighting direction.
- Each prompt should state how the shot begins from the previous shot and how it ends ready for the next shot when batch-generating a sequence.
- Avoid disconnected scene jumps, cinematic commercial lighting, product hero orbits, floating product, glowing effects, poster layouts, fake UI overlays, and perfect studio packshots unless explicitly requested.

## Default Workflow

1. Clarify the target platform, aspect ratio, product, audience, desired emotion, and whether there is an input image.
2. Choose the generation mode:
   - Text-to-video: describe the whole scene.
   - Image-to-video: treat the image as the first frame and prompt mostly for motion.
   - First-and-last-frame: describe the transition between the two frames.
   - Ingredients/reference images: preserve character, object, or style consistency.
   - Extend: continue the final second of the previous clip with coherent action.
3. Draft a compact English prompt with concrete cinematography language.
4. Add audio as a separate sentence when needed.
5. Add a negative prompt only for important exclusions, phrased as things to avoid, such as `no text overlays, no extra hands, no distorted logo, no urban background`.
6. Audit for ambiguity, overlong story chains, impossible actions, unsafe content, visible text/logo risks, and mismatched aspect ratio.
7. If output quality matters, generate 3-4 variations by changing only one variable: camera, lighting, motion intensity, or style.

## Director's Prompt Order

When a prompt feels too loose, rewrite it in this order:

```text
Camera and composition -> subject/product -> one physical action -> setting behavior -> lighting source -> style/texture -> audio -> format -> negatives
```

Why this order works:

- Camera first tells Veo what the viewer sees before it invents the scene.
- One physical action gives the clip a readable beat.
- Setting behavior makes the environment feel alive instead of like a flat backdrop.
- Lighting source gives the model a reason for highlights, shadows, reflections, and product texture.
- Audio last keeps sound design readable and separate from visual instructions.

Prefer this structure for commercial prompts:

```text
Camera: [shot type, lens/focus, motion].
Subject: [product/person with stable traits and material cues].
Continuity: begins from [previous shot state] and ends ready for [next shot state].
Action: [one clear physical beat from start to finish].
Scene: [location, time, atmospheric/background motion].
Lighting: [source, direction, quality, reflection behavior].
Style: real-shot UGC phone footage, photorealistic, natural handling, not a polished commercial ad.
Audio: [dialogue/SFX/ambience/music].
Format: [duration, aspect ratio]. Use 8 seconds if no duration is specified.
Negative: [specific exclusions].
```

## Text-To-Video Template

```text
[Composition and camera] of [subject/product] in [context]. [Action during the 4-8 second clip]. [Lighting, style, mood, texture]. [Specific camera motion and lens behavior]. Audio: [ambient sound/dialogue/music/SFX].
```

Example:

```text
Vertical 9:16 close-up product shot of a matte black travel thermos on a rain-speckled cafe table. Steam rises as a hand twists open the lid and pours hot coffee into the cap, with tiny droplets catching the morning light. Photorealistic commercial style, warm window light, shallow depth of field, crisp metal texture, subtle handheld push-in. Audio: soft cafe ambience, rain on glass, gentle pour sound, no dialogue.
```

## Structured JSON-Style Prompt

Some creators get more consistent planning by writing a JSON-like prompt, even when the interface only accepts plain text. Use this when the user wants a prompt pack, repeated scenes, or strict shot planning.

```json
{
  "duration": "8 seconds",
  "aspect_ratio": "9:16",
  "camera": "macro product shot, slow push-in, shallow depth of field",
  "subject": "the exact product from reference image 1, matte black finish, clean silhouette",
  "action": "a hand presses the lid once, steam rises naturally from the opening",
  "scene": "small kitchen counter at morning, soft background movement from window curtains",
  "lighting": "warm side window light, controlled highlights on the product edges",
  "style": "photorealistic premium ecommerce ad, realistic skin texture, crisp material detail",
  "audio": "soft click from the lid, gentle steam hiss, quiet morning room tone, no dialogue",
  "negative_prompt": "no subtitles, no extra text, no distorted logo, no extra fingers, no warped product shape"
}
```

Do not over-trust JSON formatting as a magic control layer. It is mainly useful because it forces the writer to separate camera, action, audio, format, and negatives.

## Image-To-Video Rules

When the user provides an image:

- Do not re-describe the image in detail unless there is ambiguity.
- Prompt for motion: camera movement, subject animation, environmental animation.
- Refer to people generally: `the woman`, `the subject`, `the person on the left`, `the product`.
- Keep motion plausible and subtle when preserving identity is important.
- Use high-quality, sharp, well-composed source images whenever possible.

Template:

```text
Animate this image as a [duration/style] video. [Camera motion]. [Subject/product motion]. [Environmental motion]. Preserve the subject's identity, composition, lighting, and product details. Audio: [sound direction].
```

## Reference Images / Ingredients

When using multiple reference images, explicitly assign each image a job:

- Reference 1: primary identity anchor, usually character or exact product.
- Reference 2: environment or lifestyle context.
- Reference 3: style, color grade, lighting mood, or secondary object.

Prompt pattern:

```text
Use reference image 1 for the exact product identity and silhouette. Use reference image 2 for the cafe table environment. Use reference image 3 only for the warm color grade and soft window-light treatment, not for its objects. The product sits naturally on the table as the camera slowly orbits 30 degrees around it. Preserve the label shape and product proportions.
```

Reference tips:

- Upload the most important reference first.
- Use clean, isolated product/character references when consistency matters.
- Avoid busy product references with hands, props, or backgrounds unless those elements should appear.
- Do not expect pixel-perfect labels or readable small text; protect exact packaging by using the cleanest source image and selecting the best generation.
- If a reference image includes a background that should not transfer, say so directly.

## First-And-Last-Frame Template

```text
Create a seamless [duration] transition from the first frame to the last frame. The motion begins with [starting state], evolves through [main transition], and ends exactly on [ending state]. Use [camera motion], [pacing], [style], and preserve consistent identity, scale, lighting logic, and object continuity. Audio: [sound progression].
```

Use this for product transformations, before/after reveals, packaging opening, seasonal transitions, and magical but coherent changes.

First-and-last-frame tips:

- Define the delta: what exactly changes between frame A and frame B.
- Describe the mechanical path of the change, not just the result.
- Keep the first and last frames visually compatible when you want a smooth continuous shot.
- Use `seamless transition` and concrete material changes: fabric unfolds, liquid clears, label rotates into view, cap twists open, room light warms gradually.
- For before/after ads, make only one proof change per clip: stain disappears, wrinkles smooth, clutter becomes organized, dull skin becomes hydrated.

## Ecommerce/Short-Form Ad Patterns

Use these structures for product videos:

- Product macro proof: extreme close-up, one tactile action, realistic texture, crisp sound effect.
- Problem-solution: show the annoyance, introduce product action, end with relief; usually split into 2-3 clips.
- UGC handheld: natural phone-camera feel, casual human action, real room lighting, imperfect but clean framing.
- Hero reveal: slow push-in or orbit, dramatic but believable light, product centered, no fake UI text.
- Ingredient-to-video: use product packshot, lifestyle scene, and target customer reference to maintain consistency.

For `带货` clips, prioritize one purchase-driving proof per clip: texture, fit, size, before/after, ease of use, speed, durability, or sensory appeal.

### 带货 Prompt Recipes

**1. 质感微距**

```text
Vertical 9:16 extreme macro shot of [product/detail]. [One tactile action: finger presses, cap clicks, fabric stretches, liquid pours]. The material shows [texture: ribbed fabric, brushed metal, glossy serum, soft leather] under [specific light source]. Slow push-in, shallow depth of field, photorealistic ecommerce macro. Audio: [matching close sound]. Negative: no text overlays, no distorted logo, no extra fingers.
```

**2. 使用前后**

```text
Vertical 9:16 first-and-last-frame style before-after product proof. The scene starts with [specific problem state] and transitions seamlessly into [specific improved state] as [product action] happens. Keep the camera locked, realistic lighting, no magical particles unless requested. Audio: subtle satisfying transition sound, natural room tone. Negative: no captions, no exaggerated claims, no warped product.
```

**3. UGC 口播**

```text
Vertical 9:16 handheld phone-style medium close-up of [target user] holding [product] in a real [home/car/office/gym] setting. The subject demonstrates [one simple action] and reacts naturally. Soft practical room lighting, authentic creator video style, slight handheld motion. Audio: The subject says: [one short spoken line]. Natural room tone, no subtitles.
```

**4. 商品英雄镜头**

```text
Vertical 9:16 centered hero shot of [product] on [surface/environment]. A slow 30-degree orbit reveals [key feature] while [environment detail] moves subtly in the background. Premium commercial lighting with clean highlights and realistic shadows, photorealistic, crisp product edges. Audio: subtle cinematic riser and one satisfying product sound, no dialogue.
```

## Dialogue And Audio

- Put audio in a separate sentence beginning with `Audio:`.
- For dialogue, avoid quotation marks to reduce the chance of rendered text appearing in the video.
- Use colon style: `The woman says: This actually fits in my smallest bag.`
- Keep dialogue short enough for 4-8 seconds.
- Include ambient audio and SFX when they support realism: room tone, footsteps, pouring, fabric rustle, button click, package tear.
- A rough speech budget is 1 short sentence for 6-8 seconds. If the line feels like a full paragraph, split the clip or shorten the sentence.
- Use `No subtitles` or `no on-screen text` when dialogue is present.
- Layer audio intentionally: dialogue first, then SFX, then ambience, then music. Do not ask for every possible sound in one short clip.

Useful audio phrases:

- `Audio: no dialogue, close crisp click, soft room tone.`
- `Audio: natural handheld creator voice, quiet apartment ambience, no music, no subtitles.`
- `Audio: gentle fabric rustle, zipper sound, soft satisfying snap, no dialogue.`
- `Audio: upbeat but subtle lifestyle music, product click synced to the lid closing.`

## Camera Vocabulary

Reliable camera directions:

- Static locked-off shot
- Slow push-in / dolly in
- Pull back reveal
- Tracking shot following the subject
- Handheld phone-style follow
- Smooth orbit around the product
- Top-down flat lay
- Macro rack focus
- Low-angle hero shot
- Drone-like rising reveal

Use one primary camera movement per prompt unless the clip is explicitly a transition.

Lens and focus vocabulary:

- 24mm wide lens: stronger environment, energetic movement.
- 35mm lens: natural human/UGC perspective.
- 50mm lens: flattering medium close-up, product lifestyle.
- 85mm lens: premium portrait compression.
- Macro lens: texture proof, beauty, food, packaging, fine details.
- Shallow depth of field: isolates product or face.
- Rack focus: shifts attention from problem to product, or from background to label.

Lighting vocabulary:

- Soft side window light
- Warm practical lamp light
- Golden hour backlight
- Clean studio softbox reflection
- Low-key dramatic side lighting
- High-key bright beauty lighting
- Neon rim light
- Overcast diffused daylight

Material cues that help stability:

- Brushed metal, matte plastic, glossy ceramic, ribbed cotton, translucent gel, frosted glass, polished leather, woven canvas, silicone grip, carbon fiber texture, dewy skin, velvet fabric.

## Quality Checklist

Before finalizing, check:

- Is the final prompt in English?
- Is there one clear subject and one clear action?
- Is the duration realistic for the amount of action?
- Is the aspect ratio matched to the platform?
- Does the prompt specify camera, composition, lighting, style, and mood?
- For image-to-video, is the prompt mostly motion rather than redundant scene description?
- Are dialogue and audio clearly separated?
- Are exclusions specific and necessary?
- Are brand logos, text, hands, faces, and product shapes protected from distortion where relevant?
- Does the prompt define where light comes from?
- Does the action use concrete physical verbs?
- Does the background have one subtle behavior if realism matters?
- Are references assigned clear roles?

## Common Failure Fixes

- Generic output: add concrete subject details, camera framing, lighting, and texture.
- Muddled story: split into separate clips.
- Weak product focus: move product to subject position and use macro or centered composition.
- Unstable identity: use reference images/ingredients, repeat immutable character or product features, reduce motion.
- Awkward audio: separate audio direction and shorten dialogue.
- Bad text/logos: avoid asking Veo to render legible text; provide clean source image or add `no text overlays, preserve logo shape`.
- Overdone motion: use `subtle`, `slow`, `natural`, `single continuous shot`.
- Floaty physics: replace vague verbs with force verbs such as twists, presses, slides, unfolds, snaps, pours, ripples, settles, drips, locks into place.
- Camera ignored: simplify to one camera movement, put it first, and remove competing motion.
- Product looks fake: add material, lighting source, surface contact shadows, scale cue, and one real-world interaction.
- UGC feels too polished: specify handheld phone-style, natural room tone, practical lighting, slight framing imperfection, casual delivery.
- Before/after crossfades instead of transforms: make source and target states closer, describe the exact material transition, and reduce the number of changing elements.
- Prompt rewriter changes intent: for Veo 3/3.1 on Vertex AI, assume prompt rewriting cannot be disabled; make the original prompt explicit and structured enough that rewriting preserves intent.

## Variation Strategy

For serious production, generate batches instead of trying to perfect one prompt.

- Variation A: same action, different camera.
- Variation B: same camera, stronger product macro detail.
- Variation C: same scene, different lighting source.
- Variation D: same prompt with stricter negatives.

Only change one variable at a time so the winning direction is obvious.

## Source Links

- Google Cloud Vertex AI Veo prompt guide: https://cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide
- Google Cloud Vertex AI Veo best practices: https://cloud.google.com/vertex-ai/generative-ai/docs/video/best-practice
- Google Cloud Veo 3.1 model specs: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate
- Google DeepMind Veo 3 prompt guide: https://deepmind.google/models/veo/prompt-guide/
- Google AI for Developers Gemini API video docs: https://ai.google.dev/gemini-api/docs/video
- Google Cloud prompt rewriter note: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/turn-the-prompt-rewriter-off
- Google blog, Veo 3.1 and Flow updates: https://blog.google/technology/ai/veo-updates-flow/
- Google blog, enhanced Veo 3.1 in Gemini API: https://blog.google/innovation-and-ai/technology/developers-tools/veo-3-1-gemini-api/
- Google Veo for Ads Master Class: https://business.google.com/us/accelerate/resources/articles/veo-for-ads-master-class/
