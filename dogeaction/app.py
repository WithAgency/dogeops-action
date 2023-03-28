import os
import re
from pathlib import Path
from typing import Optional

import typer
import yaml
from actions_toolkit import core
from httpx import HTTPError

from dogeaction.adapters import make_context
from dogeaction.api import DogeApi
from dogeaction.ascii import happy_message, sad_message
from dogeaction.models import dogeops as dm
from dogeaction.models.dogeops import Options

BASE_DIR = Path(__file__).parent.parent
WORKSPACE = Path(os.getenv("GITHUB_WORKSPACE", BASE_DIR))


app = typer.Typer()


class MuchError(Exception):
    pass


def has_dogefile(file: str) -> bool:
    """
    Check if the Dogefile exists.
    """
    if os.path.isfile(file):
        return True

    return False


def upload_manifest(
    manifest: str,
    ctx: dm.Context,
    opts: Options,
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
            return api.deploy(context=ctx, dogefile=spec, options=opts)
        except HTTPError as he:
            raise MuchError(he.args[0])


OPTION_RE = re.compile(r"^# +doge: (?P<command>\w+)(?: (?P<args>.*))?$", re.I | re.M)


def doge_options(ctx: dm.Context) -> Options:
    """
    Parse the commit message for DogeOps options.

    :param ctx: The DogeOps context.
    :return: The DogeOps options.
    """
    commit_msg = ctx.commit.message
    options = Options()

    match = OPTION_RE.search(commit_msg)
    if not match:
        return options

    command = match.group("command")
    if command is not None:
        command = command.lower()

    args = match.group("args")
    if args is not None:
        args = args.lower().split()

    if command == "stay":
        options.ignore = True
    elif command == "quiet":
        options.notify = False

    return options


@app.command(help="Trigger a DogeOps deployment (marked as 'push')")
def ci(event: str = typer.Argument("push", help="The event name")):
    """
    Trigger a deployment manually.
    """
    name = core.get_input("manifest") or "Dogefile"
    dogefile = WORKSPACE / name
    try:
        deployment = _trigger(event, dogefile)
        core.info(happy_message(deployment))
    except (MuchError, ValueError) as err:
        core.set_failed(f"{err.args[0]}")
        core.info(sad_message())


@app.command(help="Trigger a DogeOps deployment (marked as 'manual')")
def deploy(
    event: str = typer.Option("manual", "--event", "-e", help="The event name"),
    repo: Path = typer.Argument(..., help="The path to the local repository"),
    name: str = typer.Option("Dogefile", help="The Dogefile name"),
):
    """
    Trigger a deployment manually.
    """
    dogefile = repo / name
    try:
        deployment = _trigger(event, dogefile, repo)
        typer.secho(happy_message(deployment), fg=typer.colors.GREEN)
    except (MuchError, ValueError) as err:
        typer.secho(sad_message(), fg=typer.colors.RED)
        typer.secho(f"{err.args[0]}", fg=typer.colors.RED)
        return 1


def _trigger(event: str, dogefile: Path, repo: str = None) -> Optional[dm.Deployment]:
    """
    Trigger a deployment.
    Builds a context from the event and submits it to the API.
    """
    ctx = make_context(event, repo)
    options = doge_options(ctx)
    if options.ignore:
        core.info("Ignoring this commit")
        return

    print(f"Context: {ctx}")
    # return dm.Deployment(id="1234", status="ok", progress_url="https://dogeops.com")
    deployment = upload_manifest(dogefile, ctx, options)
    if not deployment:
        raise MuchError(f"{dogefile} does not exist")

    return deployment
