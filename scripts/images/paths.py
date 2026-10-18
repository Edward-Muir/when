"""
Where the image folders are, for the Python image scripts.

The images live outside git, in a sibling folder of the repo (`when-images`). Its location is
`WHEN_IMAGES_DIR` from the environment or the repo's `.env`, relative to the repo root, defaulting
to `../when-images`: the same rule as scripts/factory/config.js, so the two halves of the
pipeline can never disagree about where a file is.
"""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _from_dotenv(key):
    env_file = REPO_ROOT / ".env"
    if not env_file.exists():
        return None
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() == key:
            return value.strip().strip("'\"")
    return None


def images_dir():
    configured = (os.environ.get("WHEN_IMAGES_DIR") or _from_dotenv("WHEN_IMAGES_DIR") or "").strip()
    return (REPO_ROOT / (configured or "../when-images")).resolve()


IMAGES_DIR = images_dir()
GENERATED_DIR = IMAGES_DIR / "generated_images"
DOWNSAMPLED_DIR = IMAGES_DIR / "downsampled_generated_images"
INBOX_DIR = IMAGES_DIR / "inbox"
EVENTS_DIR = REPO_ROOT / "public" / "events"
