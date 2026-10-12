#!/usr/bin/env python3
"""Render scripts/video/explainer.html to dist/assets/explainer.mp4 (+ poster).

Requires Playwright (`pip install playwright && playwright install chromium`)
and ffmpeg with libx264; `pip install imageio-ffmpeg` provides a static build
that is preferred when installed. Every frame is produced by
pausing all CSS animations and seeking them to the frame time, so the output is
deterministic and independent of machine speed.

    python scripts/render-video.py            # full render
    python scripts/render-video.py --stills 2 26 50   # preview frames only
"""
import argparse, asyncio, shutil, subprocess, tempfile
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'scripts/video/explainer.html'
ASSETS = ROOT / 'dist/assets'
DURATION, FPS = 71.0, 30
SEEK = 'ms => document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; })'

async def frames(times, out_dir, fmt='png'):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})
        await page.goto(SOURCE.as_uri())
        await page.evaluate('document.fonts.ready')
        for i, t in enumerate(times):
            await page.evaluate(SEEK, t * 1000)
            await page.screenshot(path=str(out_dir / f'f{i:05d}.{fmt}'), type=fmt, **({'quality': 95} if fmt == 'jpeg' else {}))
        await browser.close()

def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return shutil.which('ffmpeg') or 'ffmpeg'

ENCODE = ['-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stills', nargs='*', type=float)
    args = ap.parse_args()
    if args.stills:
        out = ROOT / 'scripts/video/stills'; out.mkdir(exist_ok=True)
        asyncio.run(frames(args.stills, out))
        print('Wrote', len(args.stills), 'stills to', out)
        return
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        count = int(DURATION * FPS)
        asyncio.run(frames([i / FPS for i in range(count)], tmp, 'jpeg'))
        ASSETS.mkdir(exist_ok=True)
        subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(tmp / 'f%05d.jpeg'),
                        *ENCODE, str(ASSETS / 'explainer.mp4')], check=True)
        asyncio.run(frames([3.2], tmp))
        subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', str(tmp / 'f00000.png'), '-q:v', '3',
                        str(ASSETS / 'explainer-poster.jpg')], check=True)
    print('Rendered', count, 'frames →', ASSETS / 'explainer.mp4')

if __name__ == '__main__':
    main()
