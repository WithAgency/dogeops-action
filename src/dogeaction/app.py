import sys

import os

DOGE_FILE = "doge.yaml"


def has_file(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(manifest: str):
    if not has_file(manifest):
        raise ValueError("manifest not found")


def main():
    upload_manifest(DOGE_FILE)
