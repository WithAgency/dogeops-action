import os

from actions_toolkit import core
from pathlib import Path

from dogeaction.api import DogeApi

WORKSPACE = Path(os.getenv('GITHUB_WORKSPACE', "/github/workspace"))


def has_file(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(manifest: str) -> bool:
    api = DogeApi(os.environ["DOGEOPS_API_KEY"])
    core.info(f"API said: {api.ping()}")
    if not has_file(manifest):
        core.debug(f"manifest {manifest} not found")
        return False

    core.debug(f"manifest {manifest} found")
    return True


core.info(f"DEBUG is active: {core.is_debug()}")


def main():
    name = core.get_input("manifest_name")
    doge_file = f"{WORKSPACE / name}"
    uploaded = upload_manifest(doge_file)
    if not uploaded:
        core.set_failed()
