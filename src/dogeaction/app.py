import os
from pathlib import Path
from typing import Optional

import yaml
from actions_toolkit import core, github
from httpx import HTTPError

from dogeaction.adapters import from_github_context
from dogeaction.api import DogeApi
from dogeaction.ascii import happy_message, sad_message
from dogeaction.models import dogeops as dm

WORKSPACE = Path(os.getenv("GITHUB_WORKSPACE", "/github/workspace"))


class MuchError(Exception):
    pass


def has_dogefile(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(manifest: str, ctx: dm.Context) -> Optional[dm.Deployment]:
    """
    Submit the manifest and context to the API.
    """
    if not has_dogefile(manifest):
        return None

    api = DogeApi(os.environ["DOGEOPS_API_KEY"])

    with open(manifest) as man:
        spec = yaml.safe_load(man)
        try:
            return api.deploy(context=ctx, manifest=spec)
        except HTTPError as he:
            raise MuchError(he.args[0])


def make_context(ctx: github.Context) -> dm.Context:
    """
    Build a DogeOps context from a GitHub one.
    """
    return from_github_context(ctx)


def main():
    name = core.get_input("manifest")
    doge_file = f"{WORKSPACE / name}"

    try:
        ctx = make_context(github.Context())
        deployment = upload_manifest(doge_file, ctx)
        if not deployment:
            core.set_failed(f"{doge_file} does not exist")

        core.info(happy_message(deployment))
    except (MuchError, ValueError) as err:
        core.set_failed(f"{err.args[0]}")
        core.info(sad_message())
