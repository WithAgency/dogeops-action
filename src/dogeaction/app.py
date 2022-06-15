import os

from actions_toolkit import core

DOGE_FILE = "doge.yaml"


def has_file(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(manifest: str):
    if not has_file(manifest):
        raise ValueError("manifest not found")
    return "updloaded manifest"


def main():
    uploaded = upload_manifest(DOGE_FILE)
    core.info(uploaded)
