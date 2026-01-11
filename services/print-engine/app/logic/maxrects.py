
from dataclasses import dataclass
from typing import List, Optional
from PIL import Image

OVERLAP_PX = 2  # 🔥 KEY FIX (1–3 is ideal)

@dataclass
class Rect:
    x: int
    y: int
    w: int
    h: int
    rotated: bool

class MaxRectsBin:
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.free = [(0, 0, width, height)]

    def insert(self, img: Image.Image) -> Optional[Rect]:
        w, h = img.size
        w -= OVERLAP_PX
        h -= OVERLAP_PX

        best = None
        best_score = None

        for fx, fy, fw, fh in self.free:
            if w <= fw and h <= fh:
                score = fw * fh - w * h
                if best_score is None or score < best_score:
                    best = (fx, fy, w, h, False)
                    best_score = score

            if h <= fw and w <= fh:
                score = fw * fh - h * w
                if best_score is None or score < best_score:
                    best = (fx, fy, h, w, True)
                    best_score = score

        if not best:
            return None

        x, y, bw, bh, rotated = best
        rect = Rect(x, y, bw, bh, rotated)

        self._split(rect)
        self._prune()
        return rect

    def _split(self, placed: Rect):
        new_free = []
        for fx, fy, fw, fh in self.free:
            if (
                placed.x >= fx + fw or
                placed.x + placed.w <= fx or
                placed.y >= fy + fh or
                placed.y + placed.h <= fy
            ):
                new_free.append((fx, fy, fw, fh))
                continue

            if placed.x > fx:
                new_free.append((fx, fy, placed.x - fx, fh))
            if placed.x + placed.w < fx + fw:
                new_free.append((placed.x + placed.w, fy, fx + fw - (placed.x + placed.w), fh))
            if placed.y > fy:
                new_free.append((fx, fy, fw, placed.y - fy))
            if placed.y + placed.h < fy + fh:
                new_free.append((fx, placed.y + placed.h, fw, fy + fh - (placed.y + placed.h)))

        self.free = new_free

    def _prune(self):
        self.free = [
            r for r in self.free
            if not any(
                r != o and
                r[0] >= o[0] and r[1] >= o[1] and
                r[0] + r[2] <= o[0] + o[2] and
                r[1] + r[3] <= o[1] + o[3]
                for o in self.free
            )
        ]
