# Session Summary: Image Downsampling Script

**Date:** 2026-03-31

## Overview

Created a Python script to downsample the ~2MB generated PNG images to JPEG before uploading to Cloudinary, reducing storage usage from 347 MB to 30 MB (91% reduction).

## Files Created

| File                           | Description                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `images/scripts/downsample.py` | Python script that converts PNGs from `images/generated_images/` to optimized JPEGs in `images/downsampled_generated_images/` |

## Key Decisions

| Decision                   | Choice                         | Rationale                                                                                                                                                 |
| -------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Language**               | Python (Pillow)                | `sharp` (Node.js) had broken native bindings on this platform. Other image scripts in the project already use Python + Pillow.                            |
| **Output format**          | JPEG                           | Cloudinary handles final format delivery (WebP/AVIF) via `f_auto`, so JPEG is fine as the upload source. No transparency needed for painted event images. |
| **Resolution**             | Keep 1024x1024 (no resize)     | Cloudinary's URL builder serves at `width=660, dpr=auto`. Keeping 1024 provides retina headroom without upscaling.                                        |
| **Quality**                | 80 (default)                   | Sweet spot for illustrated content. Most images land at 100-300 KB (well under 500 KB target).                                                            |
| **Incremental processing** | Skip existing files by default | Supports `--force` flag to reprocess all. Enables efficient incremental runs as new images are generated.                                                 |

## Results

- **161 images processed**
- **347 MB → 30 MB** total (91% average reduction)
- Typical per-image: ~2 MB PNG → ~150-250 KB JPEG
- Outliers: A few large originals (9+ MB) compress to ~800 KB — still a major improvement

## Usage

```bash
python images/scripts/downsample.py              # Process new images only
python images/scripts/downsample.py --force       # Reprocess all
python images/scripts/downsample.py --quality 85  # Override JPEG quality
```

## Workflow Integration

The downsampled images live in `images/downsampled_generated_images/`. When uploading to Cloudinary, use this directory instead of `images/generated_images/`. The existing `scripts/update-cloudinary-urls.js` does not need changes — it reads from Cloudinary's API, not local files.

## Unfinished / Next Steps

- **`sharp` is broken**: The `sharp` npm package (v0.32.6) has missing native bindings (`sharp-darwin-x64.node`). This doesn't affect the app (sharp isn't used at runtime), but if it's needed for other scripts in the future, it should be reinstalled or upgraded.
- **Upload workflow**: The user still needs to manually upload from `downsampled_generated_images/` to Cloudinary. Could consider automating this step in the future.
- **Outlier handling**: 2 images (great-fire-london, joan-of-arc) are ~800 KB. Could add a `--max-size` flag to automatically lower quality for outliers if needed.
