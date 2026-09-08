#!/usr/bin/env python3
import json
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SET_DIR = ROOT / "SuGMember" / "Assets.xcassets" / "AppIcon.appiconset"

SLOTS = [
    ("20x20", "2x", 40),
    ("20x20", "3x", 60),
    ("29x29", "2x", 58),
    ("29x29", "3x", 87),
    ("40x40", "2x", 80),
    ("40x40", "3x", 120),
    ("60x60", "2x", 120),
    ("60x60", "3x", 180),
]


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_icon(path: Path, size: int) -> None:
    rows = []
    cx = cy = (size - 1) / 2.0
    outer = size * 0.345
    inner = size * 0.285
    gold = (202, 164, 82)
    silver = (205, 208, 214)
    bg0 = (8, 9, 11)
    bg1 = (28, 30, 34)

    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            # Subtle dark radial background, always opaque RGB.
            dx = (x - cx) / max(size, 1)
            dy = (y - cy) / max(size, 1)
            fade = min(1.0, math.sqrt(dx * dx + dy * dy) * 1.9)
            rgb = tuple(round(bg1[i] * (1 - fade) + bg0[i] * fade) for i in range(3))

            r = math.hypot(x - cx, y - cy)
            if inner <= r <= outer:
                rgb = gold

            # Minimal S.u.G-inspired three-part center mark.
            bar = max(1.0, size * 0.026)
            if abs(x - cx) <= bar and abs(y - cy) <= size * 0.17:
                rgb = silver
            if math.hypot(x - (cx - size * 0.11), y - (cy - size * 0.11)) <= size * 0.035:
                rgb = gold
            if math.hypot(x - (cx + size * 0.11), y - (cy + size * 0.11)) <= size * 0.035:
                rgb = gold

            row.extend(rgb)
        rows.append(bytes(row))

    raw = b"".join(rows)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit RGB, no alpha
    png = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", zlib.compress(raw, 9)) + png_chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    SET_DIR.mkdir(parents=True, exist_ok=True)
    images = []
    for logical_size, scale, pixels in SLOTS:
        filename = f"AppIcon-{pixels}.png"
        write_icon(SET_DIR / filename, pixels)
        images.append({
            "idiom": "iphone",
            "size": logical_size,
            "scale": scale,
            "filename": filename,
        })

    marketing = "AppIcon-1024.png"
    write_icon(SET_DIR / marketing, 1024)
    images.append({
        "idiom": "ios-marketing",
        "size": "1024x1024",
        "scale": "1x",
        "filename": marketing,
    })

    contents = {
        "images": images,
        "info": {"author": "xcode", "version": 1},
    }
    (SET_DIR / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")
    print(f"Generated AppIcon asset catalog at {SET_DIR}")


if __name__ == "__main__":
    main()
