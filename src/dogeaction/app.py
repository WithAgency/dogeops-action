import os

from actions_toolkit import core
from pathlib import Path

from dogeaction.api import DogeApi

WORKSPACE = Path(os.getenv('GITHUB_WORKSPACE', "/github/workspace"))


def has_file(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(manifest: str):
    api = DogeApi(os.environ["DOGEOPS_API_KEY"])
    core.debug(api.ping())
    if not has_file(manifest):
        raise ValueError("manifest not found")
    return "updloaded manifest"


def main():
    name = core.get_input("manifest_name")
    doge_file = f"{WORKSPACE / name}"
    uploaded = upload_manifest(doge_file)
    core.info(uploaded)
