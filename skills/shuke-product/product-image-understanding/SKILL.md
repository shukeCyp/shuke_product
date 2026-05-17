---
name: product-image-understanding
description: "Use this skill to analyze product images using Yunwu API (Gemini 3.1 Pro Preview). Sends product image to Yunwu's Gemini endpoint for structured visual understanding of product type, packaging, text, materials, and usage context. Called BEFORE the product-image-video-storyboard workflow."
category: shuke-product
---

# Product Image Understanding

Use this skill when the user provides a product image and needs automated visual analysis before generating ecommerce storyboards, scripts, or media. This skill is a prerequisite step for `product-image-video-storyboard`.

## Overview

This skill sends a product image to Yunwu API's Gemini endpoint for structured visual understanding. It extracts all visible product information: product type, brand, packaging details, text/labels, colors, materials, size, and usage context. The output is saved as a structured JSON file and used as input for downstream storyboard generation.

Supports two input modes:
- **Single image file**: directly analyze the image (existing behavior).
- **Folder path**: scan the folder for product images and info files, select the primary image, read supplementary text, and run enriched analysis.

## Folder Input Handling

When the user provides a **folder path** instead of a single image file:

### Step A: Scan the folder

List all files in the folder and classify them:

```bash
# Image files (case-insensitive extensions)
find "<folder_path>" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) | sort

# Info files
find "<folder_path>" -maxdepth 1 -type f \( -iname "*.md" -o -iname "*.txt" -o -iname "*.json" \) | sort
```

Image file extensions: `.png`, `.jpg`, `.jpeg`, `.webp`
Info file extensions: `.md`, `.txt`, `.json`

### Step B: Identify primary product image

Select the primary product image by this priority:
1. Largest file (bytes) — usually the highest quality product shot
2. If sizes are equal, pick the first alphabetically
3. Record all other images as `supplementary_images` for reference

```bash
# Find the largest image file
PRIMARY_IMAGE=$(find "<folder_path>" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) -exec ls -1S {} + | head -1)
SUPPLEMENTARY_IMAGES=$(find "<folder_path>" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) -exec ls -1S {} + | tail -n +2)
```

### Step C: Read info files

Read the content of all info files. Merge their content as supplementary context for the analysis prompt:

```bash
INFO_CONTEXT=""
for f in <info_files>; do
  case "$f" in
    *.json)
      # Parse JSON and extract known product keys
      JSON_TEXT=$(python3 -c "
import json
with open('$f') as fh:
    d = json.load(fh)
# Flatten known product keys into readable text
for k in ['product_name','brand','description','category','features','specs','usage','ingredients','material']:
    if k in d:
        print(f'{k}: {d[k]}')
")
      INFO_CONTEXT+="\n--- from $(basename "$f") ---\n$JSON_TEXT\n"
      ;;
    *.md|*.txt)
      INFO_CONTEXT+="\n--- from $(basename "$f") ---\n$(cat "$f")\n"
      ;;
  esac
done
```

### Step D: Build enriched analysis prompt

Prepend the info file content to the standard analysis prompt:

```text
[Product info files provided by user]:
${INFO_CONTEXT}

[Product image analysis]:
请用中文详细描述这张产品图片。我需要知道：
1. 这是什么产品？产品名称、品类
...
```

This allows Gemini to cross-reference the image with the user-provided product details, verify consistency, and fill in gaps.

### Step E: Run Gemini analysis

Use the primary image + enriched prompt. The API call is the same single-image format; the enrichment is in the text prompt, not in additional images.

### Step F: Save extended output

In addition to the standard `product_analysis.md` and `product_analysis.json`, record input source metadata:

- `product_analysis.json` gains extra fields:
  - `input_type`: `"file"` or `"folder"`
  - `primary_image`: path to the primary product image
  - `supplementary_images`: list of other image paths
  - `info_files`: list of info file paths read
  - `info_files_summary`: brief summary of what each info file provided

## Configuration

Read from `../config/media_services.yaml`:

```yaml
yunwu:
  base_url: "https://yunwu.ai"
  api_key: "<your-api-key>"
  models:
    analysis_preferred: "gemini-3.1-pro-preview"
    analysis_fallback: "gemini-2.5-pro"
```

## API Endpoint

```
POST {yunwu.base_url}/v1beta/models/{model}:generateContent?key={api_key}
```

Auth: `Authorization: Bearer {api_key}` + `?key={api_key}` query parameter.
Content-Type: `application/json`

## Workflow

1. **Read config**: Load `yunwu` section from `../config/media_services.yaml`.
2. **Determine input type**:
   - If input is a **file**: use it directly as the primary image (existing behavior).
   - If input is a **folder**: run Steps A-C from Folder Input Handling above (scan, pick primary image, read info files). Build enriched prompt from Step D.
3. **Prepare image**: Convert/resize the primary product image to JPEG max 768px, read as base64.
4. **Build payload**: Gemini native format with `inline_data` (mime_type: image/jpeg or image/png). If info files were read, prepend their content to the text prompt.
5. **Send request**: POST to Yunwu Gemini endpoint with the product understanding prompt (enriched with info file content if folder input).
6. **Parse response**: Extract text from `candidates[0].content.parts[0].text`.
7. **Save result**: Save structured analysis to `product_analysis.md` and `product_analysis.json` in the project folder. If folder input, include `input_type`, `primary_image`, `supplementary_images`, `info_files`.
8. **Return**: Provide the analysis summary for downstream storyboard/script generation.

## Product Understanding Prompt (Chinese — default for user-facing analysis)

```text
请用中文详细描述这张产品图片。我需要知道：
1. 这是什么产品？产品名称、品类
2. 包装细节：颜色、材质、形状、尺寸感
3. 所有可见的文字：品牌名、产品名、卖点文案、成分、使用说明、认证标识等（请直接照抄包装上的文字）
4. 标签和logo设计
5. 产品形态：液体/膏体/固体/胶囊/喷雾等
6. 目标使用场景推断
7. 任何可识别的视觉特征、材质、纹理

请尽可能详细，不要编造看不到的信息。
```

## Product Understanding Prompt (English — for English market analysis)

```text
Describe this product image in detail. I need to know:
1. What product is this? Product name, category
2. Packaging details: colors, materials, shape, size feel
3. All visible text: brand name, product name, selling points, ingredients, usage instructions, certifications (copy the text exactly as shown on packaging)
4. Label and logo design
5. Product form: liquid/cream/solid/capsule/spray etc.
6. Inferred usage scenario
7. Any identifiable visual features, materials, textures

Be as detailed as possible. Do not invent information not visible in the image.
```

## Python Call Template (Single File)

```python
import base64, json, os, requests, yaml

# Load config
with open("../config/media_services.yaml") as f:
    config = yaml.safe_load(f)

yunwu = config["yunwu"]
api_key = yunwu["api_key"]
base_url = yunwu["base_url"]
model = yunwu["models"]["analysis_preferred"]
url = f"{base_url}/v1beta/models/{model}:generateContent?key={api_key}"

input_path = "path/to/product.jpg"  # or "path/to/folder/"

# --- Folder handling ---
supplementary_images = []
info_files = []
info_context = ""

if os.path.isdir(input_path):
    IMG_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
    INFO_EXTS = {".md", ".txt", ".json"}
    all_files = [os.path.join(input_path, f) for f in os.listdir(input_path) if os.path.isfile(os.path.join(input_path, f))]
    images = sorted([f for f in all_files if os.path.splitext(f)[1].lower() in IMG_EXTS],
                    key=lambda f: os.path.getsize(f), reverse=True)
    infos = [f for f in all_files if os.path.splitext(f)[1].lower() in INFO_EXTS]
    if not images:
        raise ValueError("No image files found in folder")
    primary_image = images[0]
    supplementary_images = images[1:]
    for f in infos:
        ext = os.path.splitext(f)[1].lower()
        if ext == ".json":
            with open(f) as fh:
                d = json.load(fh)
            lines = [f"{k}: {d[k]}" for k in ['product_name','brand','description','category','features','specs','usage','ingredients','material'] if k in d]
            info_context += f"\n--- {os.path.basename(f)} ---\n" + "\n".join(lines) + "\n"
        else:
            with open(f) as fh:
                info_context += f"\n--- {os.path.basename(f)} ---\n{fh.read()}\n"
    info_files = infos
else:
    primary_image = input_path

# Prepare image
with open(primary_image, "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("ascii")

# Build prompt (enriched with info files if any)
base_prompt = "请用中文详细描述这张产品图片。我需要知道：..."
if info_context:
    prompt = f"[Product info files provided by user]:\n{info_context}\n[Product image analysis]:\n{base_prompt}"
else:
    prompt = base_prompt

# Build payload
payload = {
    "contents": [{
        "role": "user",
        "parts": [
            {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}},
            {"text": prompt}
        ]
    }]
}

# Send request
resp = requests.post(
    url,
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
    json=payload,
    timeout=120,
)
resp.raise_for_status()

# Parse response
result = resp.json()
analysis_text = result["candidates"][0]["content"]["parts"][0]["text"]
print(analysis_text)
```

## Output Files

Save these in the product project folder (e.g., `~/Downloads/product/YYYYMMDD_HHMMSS_product_slug/`):

- `product_analysis.md` — Full analysis text from Gemini
- `product_analysis.json` — Structured metadata extracted from the analysis

### product_analysis.json schema

```json
{
  "product_name": "",
  "product_category": "",
  "brand": "",
  "packaging": {
    "colors": [],
    "materials": [],
    "shape": "",
    "size": ""
  },
  "text_on_packaging": [],
  "product_form": "",
  "usage_scenario": "",
  "visual_features": [],
  "target_market_language": "",
  "analysis_timestamp": "",
  "input_type": "file | folder",
  "primary_image": "",
  "supplementary_images": [],
  "info_files": [],
  "info_files_summary": ""
}
```

Fields set only for folder input: `input_type`, `primary_image`, `supplementary_images`, `info_files`, `info_files_summary`.

For file input, `input_type` is `"file"` and the extra fields can be omitted or empty.

## Integration with product-image-video-storyboard

This skill is designed to be the FIRST step in the product-image-video-storyboard workflow. After running this skill:

1. The product analysis text and JSON become the foundation for script/strategy decisions.
2. The analysis informs the `commerce_market` language matching (e.g., if packaging is in Spanish for Mexico market).
3. The analysis feeds into `script.md`, `prompts.json`, and `references.json` generation.

## Troubleshooting

- **401/403**: Check API key in media_services.yaml
- **400 Bad Request**: Validate JSON shape, check mime_type
- **Request too large**: Resize image to max 768px, use JPEG at quality 80-85
- **Vague response**: Use the detailed prompt with explicit instructions to copy text exactly
- **Timeout**: Set timeout >= 120s for Gemini Pro Preview models
