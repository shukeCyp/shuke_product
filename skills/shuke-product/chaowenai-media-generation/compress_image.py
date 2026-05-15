#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片无损/高质量压缩脚本
在调用 ChaowenAI 视频生成前，对首帧图/参考图进行压缩，
减少 base64 传输大小，提升 API 调用速度。

用法：
  python3 compress_image.py <image_path> [threshold_bytes]

  threshold_bytes: 压缩阈值，默认 1048576 (1MB)
  当图片 ≤ 阈值时不触发压缩，直接输出原路径。

输出格式：
  COMPRESSED:<path>|<original_size>|<compressed_size>|<label>
  SKIPPED:<path>|<size>|<reason>          (无需压缩时)

参考实现来源：video_plugin_chaowen/main.py _compress_image_if_needed
"""

import os
import sys
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    print("ERROR: 需要安装 Pillow 库: pip install Pillow", file=sys.stderr)
    sys.exit(1)


def guess_mime_type(path: str) -> str:
    """根据扩展名推断 MIME 类型"""
    lower = path.lower()
    if lower.endswith('.png'):
        return 'image/png'
    if lower.endswith(('.jpg', '.jpeg', '.jpe')):
        return 'image/jpeg'
    if lower.endswith('.webp'):
        return 'image/webp'
    if lower.endswith('.gif'):
        return 'image/gif'
    if lower.endswith('.bmp'):
        return 'image/bmp'
    return 'application/octet-stream'


def compress_image(file_path: str, threshold_bytes: int = 1024 * 1024):
    """
    对图片进行无损/高质量压缩，返回压缩后的字节数据。

    Args:
        file_path: 图片文件路径
        threshold_bytes: 压缩阈值，超过此大小才触发压缩

    Returns:
        (compressed_bytes, mime_type, original_size, compressed_size, was_compressed, label)
    """
    file_path = str(file_path)
    original_size = os.path.getsize(file_path)
    original_mime = guess_mime_type(file_path)

    if original_size <= threshold_bytes:
        return None, original_mime, original_size, original_size, False, '未触发(低于阈值)'

    def save_candidate(img, target_format, target_mime, **save_kwargs):
        output = BytesIO()
        save_img = img
        if target_format in ('JPEG',) and img.mode not in ('RGB', 'L'):
            save_img = img.convert('RGB')
        save_img.save(output, format=target_format, **save_kwargs)
        return output.getvalue(), target_mime

    try:
        with Image.open(file_path) as img:
            fmt = (img.format or '').upper()
            candidates = []

            # 第一阶段：无损 / 尽量无损
            try:
                if fmt == 'PNG' or original_mime == 'image/png':
                    data, mime = save_candidate(img, 'PNG', 'image/png', optimize=True, compress_level=9)
                    candidates.append(('无损PNG优化', data, mime))
                    data, mime = save_candidate(img, 'WEBP', 'image/webp', lossless=True, method=6)
                    candidates.append(('无损WebP', data, mime))
                elif fmt == 'WEBP' or original_mime == 'image/webp':
                    data, mime = save_candidate(img, 'WEBP', 'image/webp', lossless=True, method=6)
                    candidates.append(('无损WebP', data, mime))
                elif fmt == 'GIF' or original_mime == 'image/gif':
                    data, mime = save_candidate(img, 'GIF', 'image/gif', optimize=True, save_all=True)
                    candidates.append(('无损GIF优化', data, mime))
                    data, mime = save_candidate(img.convert('RGBA'), 'WEBP', 'image/webp', lossless=True, method=6)
                    candidates.append(('无损WebP', data, mime))
                elif original_mime == 'image/jpeg':
                    data, mime = save_candidate(img, 'JPEG', 'image/jpeg', optimize=True,
                                                progressive=True, quality=95, subsampling=0)
                    candidates.append(('高质量JPEG优化', data, mime))
                else:
                    data, mime = save_candidate(
                        img.convert('RGBA') if img.mode not in ('RGB', 'RGBA', 'L') else img,
                        'WEBP', 'image/webp', lossless=True, method=6)
                    candidates.append(('无损WebP', data, mime))
            except Exception:
                pass

            # 第二阶段：高质量有损压缩（确保比原图更小）
            try:
                has_alpha = 'A' in img.getbands()
                if has_alpha:
                    for quality in (95, 90, 85, 80):
                        data, mime = save_candidate(img.convert('RGBA'), 'WEBP', 'image/webp',
                                                    quality=quality, method=6)
                        candidates.append((f'高质量WebP(q={quality})', data, mime))
                else:
                    for quality in (95, 90, 85, 80):
                        data, mime = save_candidate(img, 'JPEG', 'image/jpeg', optimize=True,
                                                    progressive=True, quality=quality)
                        candidates.append((f'高质量JPEG(q={quality})', data, mime))
                    for quality in (95, 90, 85):
                        data, mime = save_candidate(img, 'WEBP', 'image/webp', quality=quality, method=6)
                        candidates.append((f'高质量WebP(q={quality})', data, mime))
            except Exception:
                pass

            best = None
            for label, data, mime in candidates:
                size = len(data)
                if size <= 0:
                    continue
                if best is None or size < best[3]:
                    best = (label, data, mime, size)

            if not best or best[3] >= original_size:
                return None, original_mime, original_size, original_size, False, '收益不足(压缩后反而更大)'

            label, compressed_bytes, compressed_mime, compressed_size = best
            ratio = (1 - compressed_size / original_size) * 100
            print(f"[压缩成功] {os.path.basename(file_path)}: "
                  f"{original_size / 1024:.1f}KB -> {compressed_size / 1024:.1f}KB "
                  f"(-{ratio:.1f}%) 策略={label}", file=sys.stderr)
            return compressed_bytes, compressed_mime, original_size, compressed_size, True, label

    except Exception as e:
        print(f"[压缩失败] {file_path}: {e}", file=sys.stderr)
        return None, original_mime, original_size, original_size, False, f'异常: {e}'


def main():
    if len(sys.argv) < 2:
        print("用法: python3 compress_image.py <image_path> [threshold_bytes]", file=sys.stderr)
        print("  threshold_bytes: 默认 1048576 (1MB)", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    threshold = int(sys.argv[2]) if len(sys.argv) > 2 else 1024 * 1024

    if not os.path.exists(image_path):
        print(f"ERROR: 文件不存在: {image_path}", file=sys.stderr)
        sys.exit(1)

    compressed_bytes, mime_type, original_size, compressed_size, was_compressed, label = \
        compress_image(image_path, threshold)

    if was_compressed and compressed_bytes is not None:
        # 输出压缩后的文件到原路径同目录，添加 _compressed 后缀
        base, ext = os.path.splitext(image_path)
        if 'webp' in mime_type:
            out_path = f"{base}_compressed.webp"
        elif 'jpeg' in mime_type:
            out_path = f"{base}_compressed.jpg"
        elif 'png' in mime_type:
            out_path = f"{base}_compressed.png"
        else:
            out_path = f"{base}_compressed{ext}"

        with open(out_path, 'wb') as f:
            f.write(compressed_bytes)

        print(f"COMPRESSED:{out_path}|{original_size}|{compressed_size}|{label}")
    else:
        print(f"SKIPPED:{image_path}|{original_size}|{label}")


if __name__ == '__main__':
    main()
