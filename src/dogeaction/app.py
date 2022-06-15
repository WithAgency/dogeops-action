import os

from actions_toolkit import core
from pathlib import Path

WORKSPACE = Path(os.getenv('GITHUB_WORKSPACE', "/github/workspace"))

DOGE_FILE = f"{WORKSPACE / 'doge.yaml'}"


def has_file(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(manifest: str):
    if not has_file(manifest):
        raise ValueError("manifest not found")
    return "updloaded manifest"


def main():
    manifest = core.get_input("manifest")
    p = Path(manifest).resolve()
    core.debug(f"looking for file {p}")
    uploaded = upload_manifest(p)
    print(uploaded)
