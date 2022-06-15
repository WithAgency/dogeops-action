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
    path = Path(manifest).resolve()
    core.debug(f"{path=}")
    core.debug(f"looking for file {DOGE_FILE}")
    core.debug(os.getcwd())
    uploaded = upload_manifest(DOGE_FILE)
    core.info(uploaded)
