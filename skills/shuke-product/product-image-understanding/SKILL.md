---
name: product-image-understanding
description: "Use this skill to analyze product images using Yunwu API (Gemini 3.1 Pro Preview). Sends product image to Yunwu's Gemini endpoint for structured visual understanding of product type, packaging, text, materials, and usage context. Called BEFORE the product-image-video-storyboard workflow."
category: shuke-product
---

# Product Image Understanding

Use this skill when the user provides a product image and needs automated visual analysis before generating ecommerce storyboards, scripts, or media. This skill is a prerequisite step for `product-image-video-storyboard`.

## Overview

This skill sends a product image to Yunwu API's Gemini endpoint for structured visual understanding. It extracts all visible product information: product type, brand, packaging details, text/labels, colors, materials, size, and usage context. The output is saved as a structured JSON file and used as input for downstream storyboard generation.

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
2. **Prepare image**: Convert/resize product image to JPEG max 768px, read as base64.
3. **Build payload**: Gemini native format with `inline_data` (mime_type: image/jpeg or image/png).
4. **Send request**: POST to Yunwu Gemini endpoint with the product understanding prompt.
5. **Parse response**: Extract text from `candidates[0].content.parts[0].text`.
6. **Save result**: Save structured analysis to `product_analysis.md` and `product_analysis.json` in the project folder.
7. **Return**: Provide the analysis summary for downstream storyboard/script generation.

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

## Python Call Template

```python
import base64
import json
import requests
import yaml

# Load config
with open("../config/media_services.yaml") as f:
    config = yaml.safe_load(f)

yunwu = config["yunwu"]
api_key = yunwu["api_key"]
base_url = yunwu["base_url"]
model = yunwu["models"]["analysis_preferred"]
url = f"{base_url}/v1beta/models/{model}:generateContent?key={api_key}"

# Prepare image
with open("path/to/product.jpg", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("ascii")

# Build payload
payload = {
    "contents": [{
        "role": "user",
        "parts": [
            {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}},
            {"text": "请用中文详细描述这张产品图片。"}
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
  "analysis_timestamp": ""
}
```

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
