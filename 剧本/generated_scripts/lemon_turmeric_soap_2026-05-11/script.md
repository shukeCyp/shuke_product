# SNMYD Lemon Turmeric Kojic Acid Soap Storyboard

## Product Assumptions

- Product: SNMYD Lemon Turmeric Kojic Acid Soap, orange rectangular soap bar with matching orange/brown retail box.
- Visible pack text: SNMYD, LEMON TURMERIC, KOJIC ACID SOAP, Deep Cleansing, Moisturize Skin, For Face And Body, NET:100g/3.53oz.
- Practical direction: TikTok-style UGC bathroom cleansing demo for women who want a simple face/body cleansing step.
- Compliance boundary: do not promise whitening, dark spot removal, acne treatment, or guaranteed skin results. Use clean-feel, refreshed, smoother-looking, and brighter-looking appearance language.

## Matched Reference Videos

| video_id | 匹配点 | 借用结构 | 风险处理 |
|---|---|---|---|
| 2026-05-10_tiktok_7629819490989051166 | 去角质/清洁类，强信任实测 | 原位二次测试法 | 不做“毛孔垃圾/治疗”夸张表达，改成同位清洁感验证 |
| 2026-05-10_tiktok_7635744346884541727 | 手背实测、结果前置、护肤前置步骤 | 清洁步骤让后续护肤更有仪式感 | 避免“立刻变年轻/淡斑”等功效承诺 |
| 2026-05-10_tiktok_7635503041873022221_copy1 | 痛点、错误偏方、平价替代 | 别再用刺激性 DIY，换成温和清洁 routine | 避免前后对比过度美化 |
| 2026-05-10_tiktok_7630212708008283405 | 身体护理、姜黄/天然成分角度 | 成分视觉识别 + 使用场景 | 不宣称治疗色素沉着 |

## Core Selling Angle

Stop using harsh DIY lemon scrubs. Make the cleansing step look satisfying: wet soap texture, creamy lather, same-spot rinse proof, and a simple bathroom routine that leaves skin feeling clean and refreshed.

## Storyboard

| 镜头 | 规划时长 | 生成时长 | 画面 | 口播/字幕 | 首帧图提示词 | 视频提示词 | 剪辑备注 |
|---|---:|---:|---|---|---|---|---|
| 1 | 4s | 8s | 浴室台面近景，湿手拿起橙色香皂，包装在后方清晰露出 | "If your cleansing step feels too harsh, watch this." / 字幕：Stop harsh DIY cleansing | Use first frame shot_01; close-up wet hands holding orange soap, box behind, same bathroom | Camera: tight handheld counter close-up. Subject: same hands pick up the orange SNMYD soap and tilt it under soft bathroom light. Action: hands rotate the soap once, showing water droplets and texture. Scene: same vanity. Format: 8 seconds. Negative: no extra hands, no changed package, no medical claims. | 取前 3-4 秒做开场钩子 |
| 2 | 5s | 8s | 创作者对镜子，指脸颊，手拿包装，表达“我以前清洁太猛” | "I used to scrub with random lemon hacks. My skin hated it." / 字幕：Stop over-scrubbing | Use first frame shot_02; same creator mirror angle, concerned expression, box beside cheek | Camera: mirror/selfie medium close-up. Subject: same creator lowers her pointing hand and brings the box closer to camera. Action: one natural line to camera, concerned to matter-of-fact expression. Scene: same bathroom. Format: 8 seconds. Negative: no second actor in mirror, no skin disease visuals. | 可保留 5 秒，切在她举起包装时 |
| 3 | 5s | 8s | 水槽上方特写，双手揉皂起泡，泡沫细腻 | "This is lemon turmeric kojic acid soap. I use it as my clean-feel reset." / 字幕：Creamy lather test | Use first frame shot_03; over-sink close-up, same hands rub soap, light foam starts | Camera: macro handheld over sink. Subject: same hands rub the soap in slow circular motion. Action: lather builds from light to creamy, then hands pause to show texture. Scene: same sink/faucet. Format: 8 seconds. Negative: no fused fingers, no product floating. | 用中间 4-5 秒做质地证明 |
| 4 | 6s | 8s | 手背同一位置轻揉、冲洗，展示自然清爽光泽 | "Same spot, gentle cleanse, rinse. No dramatic filter, just a cleaner feel." / 字幕：Same-spot rinse proof | Use first frame shot_04; macro hand-back cleansing proof, soap near lower edge | Camera: macro close-up. Subject: back of same hand and orange soap. Action: the other hand gently rinses the lather from the same spot; skin looks clean and naturally refreshed, not artificially whitened. Scene: same sink. Format: 8 seconds. Negative: no exaggerated whitening, no before/after miracle. | 这是核心信任镜头，保留 5-6 秒 |
| 5 | 5s | 8s | 创作者微笑展示包装和皂体，指向下方购买区 | "For face and body, quick shower shelf staple. Tap the product card before it sells out." / 字幕：SNMYD Lemon Turmeric Soap | Use first frame shot_05; same creator smiles, holds box and soap bar side by side | Camera: handheld selfie medium close-up. Subject: same creator holds the box and soap, then points gently downward with one hand. Action: natural smile, product tilted toward camera. Scene: same bathroom. Format: 8 seconds. Negative: no fake certification badges, no redesign. | 取 4-5 秒做 CTA，保留产品正面 |

## First-Frame QA

| 镜头 | 首帧路径 | 状态 | 异常检查 | 处理决定 |
|---|---|---|---|---|
| 1 | /Users/chaiyapeng/Documents/shuke_product/outputs/lemon_turmeric_soap/first_frames/shot_01_first_frame.png | pass | 手部正常，包装结构可识别，场景连续 | 可直接用于 I2V |
| 2 | /Users/chaiyapeng/Documents/shuke_product/outputs/lemon_turmeric_soap/first_frames/shot_02_first_frame.png | pass | 镜中为同一人物；手指、脸、衣服一致；包装小字有模型风险 | 可用，视频提示需强调 same actor only |
| 3 | /Users/chaiyapeng/Documents/shuke_product/outputs/lemon_turmeric_soap/first_frames/shot_03_first_frame.png | pass | 手部接触自然，泡沫合理；戒指/袖口不明显但不影响动作 | 可直接用于质地镜头 |
| 4 | /Users/chaiyapeng/Documents/shuke_product/outputs/lemon_turmeric_soap/first_frames/shot_04_first_frame.png | usable_with_crop/edit | 产品盒底部部分裁切，手部基本正常，动作清晰 | 可用于同位清洁验证；如要强包装露出可重生 |
| 5 | /Users/chaiyapeng/Documents/shuke_product/outputs/lemon_turmeric_soap/first_frames/shot_05_first_frame.png | pass | 人物一致，包装和皂体清楚，手指正常 | 可直接用于 CTA |
