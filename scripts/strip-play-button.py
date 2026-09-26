# Убирает вшитую кнопку воспроизведения с обложек видео из Instagram.
#
# Instagram вклеивает в og:image видео полупрозрачный тёмный круг с белым
# треугольником ровно по центру кадра. На сайте это выглядит как «кнопка play»
# посреди фотографии, поэтому круг затирается методом Telea.
#
# Оригиналы лежат в raw/instagram и не трогаются. Результат пишется в
# assets/instagram, откуда его забирает сборка. Скрипт идемпотентен:
# можно запускать сколько угодно раз.
#
# Запуск:  python scripts/strip-play-button.py
#
# Геометрия измерена по кадрам 360x640: радиус круга ~48 px при ширине 360,
# то есть 0.133 от меньшей стороны. Берём 0.145 с запасом на размытую кромку.

import glob
import os
import shutil
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'raw', 'instagram')
DST = os.path.join(ROOT, 'assets', 'instagram')
RATIO = 0.145
PAD = 3


def process(src_path: str, dst_path: str) -> str:
    img = cv2.imread(src_path)
    if img is None:
        return 'не читается'

    h, w = img.shape[:2]

    # Обложки видео приходят портретными (9:16), фотопосты — квадратными.
    if h <= w:
        shutil.copyfile(src_path, dst_path)
        return f'{w}x{h} — фото, копирую как есть'

    radius = int(round(RATIO * min(h, w)))
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(mask, (w // 2, h // 2), radius + PAD, 255, thickness=-1)

    # Telea заполняет круг цветом окружения, затем лёгкое размытие прячет
    # границу между заливкой и фотографией. Размытие намеренно слабое:
    # сильное даёт заметное «пятно» на ровных фонах вроде драпировки.
    fixed = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)
    soft = cv2.GaussianBlur(fixed, (0, 0), 2.5)
    feather = cv2.GaussianBlur(mask, (0, 0), 3).astype(np.float32) / 255.0
    out = (
        fixed.astype(np.float32) * (1 - feather[..., None])
        + soft.astype(np.float32) * feather[..., None]
    ).astype(np.uint8)

    cv2.imwrite(dst_path, out, [int(cv2.IMWRITE_JPEG_QUALITY), 94])
    return f'кнопка убрана, радиус {radius}px'


def main() -> int:
    os.makedirs(DST, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC, '*.jpg')))
    if not files:
        print('нет файлов в', SRC)
        return 1

    for path in files:
        name = os.path.basename(path)
        print(f'{name:<34} {process(path, os.path.join(DST, name))}')

    manifest = os.path.join(SRC, '_manifest.json')
    if os.path.exists(manifest):
        shutil.copyfile(manifest, os.path.join(DST, '_manifest.json'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
