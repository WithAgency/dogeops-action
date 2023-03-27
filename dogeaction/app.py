import os
import re
from pathlib import Path
from typing import Optional

import yaml
from actions_toolkit import core, github
from httpx import HTTPError

from dogeaction.adapters import from_github_context
from dogeaction.api import DogeApi
from dogeaction.ascii import happy_message, sad_message
from dogeaction.models import dogeops as dm
from dogeaction.models.dogeops import Options

WORKSPACE = Path(os.getenv("GITHUB_WORKSPACE", "/github/workspace"))


class MuchError(Exception):
    pass


def has_dogefile(file: str) -> bool:
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(
    manifest: str, ctx: dm.Context, opts: Options
) -> Optional[dm.Deployment]:
    """
    Submit the manifest and context to the API.
    """
    if not has_dogefile(manifest):
        return None

    if "DOGEOPS_API_KEY" not in os.environ:
        raise MuchError("DOGEOPS_API_KEY not set")

    api = DogeApi(os.environ["DOGEOPS_API_KEY"])

    with open(manifest) as man:
        spec = yaml.safe_load(man)
        try:
            return api.deploy(context=ctx, manifest=spec, options=opts)
        except HTTPError as he:
            raise MuchError(he.args[0])


def make_context(ctx: github.Context) -> dm.Context:
    """
    Build a DogeOps context from a GitHub one.
    """
    return from_github_context(ctx)


OPTION_RE = re.compile(r"^# +doge: (?P<command>\w+)(?: (?P<args>.*))?$", re.I | re.M)


def doge_options(ctx: dm.Context) -> Options:
    """ """
    commit_msg = ctx.commit.message
    options = Options()

    match = OPTION_RE.search(commit_msg)
    if not match:
        return options

    command = match.group("command").lower()
    args = match.group("args").lower().split()
    if command == "ignore":
        options.ignore = True
    elif command.startswith("shh"):
        options.notify = False

    return options


def main():
    name = core.get_input("manifest")
    doge_file = f"{WORKSPACE / name}"

    try:
        ctx = make_context(github.Context())
        options = doge_options(ctx)
        if options.ignore:
            core.info("Ignoring this commit")
            return

        deployment = upload_manifest(doge_file, ctx, options)
        if not deployment:
            raise MuchError(f"{doge_file} does not exist")

        core.info(happy_message(deployment))
    except (MuchError, ValueError) as err:
        core.set_failed(f"{err.args[0]}")
        core.info(sad_message())
