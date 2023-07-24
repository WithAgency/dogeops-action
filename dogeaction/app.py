import logging
import os
import re
from pathlib import Path
from typing import Optional

import typer
from httpx import HTTPError

from dogeaction.adapters import get_dogefile, get_repo_context
from dogeaction.api import DogeApi
from dogeaction.ascii import happy_message, sad_message
from dogeaction.models import dogeops as dm
from dogeaction.models.dogeops import Options

logger = logging.getLogger(__name__)

app = typer.Typer(name="doge", add_completion=False)


class MuchError(Exception):
    pass


COMMAND_RE = re.compile(r"^# +doge: (?P<command>\w+)(?P<args>.*)?$", re.I | re.M)
OPTION_LIST_RE = re.compile(r"(?P<name>\w+)(?:=(?P<value>\w+))?")


def parse_doge_options(message: str) -> Optional[Options]:
    command = ""
    options = {}

    # Loop through lines in the input
    for line in message.splitlines():
        match = COMMAND_RE.match(line)
        if match:
            # Extract the command from the first capturing group
            command = match.group(1)
            # Extract the option list from the second capturing group
            option_list = match.group(2)
            print(f"Command: {command}")

            # Extract option names and values from the option list
            while match := OPTION_LIST_RE.search(option_list):
                # Extract the option name from the first capturing group
                option_name = match.group(1)
                # Extract the option value from the second capturing group
                option_value = match.group(2)
                print(f"Option Name: {option_name}")
                print(f"Option Value: {option_value}")
                # Add the option name-value pair to the options dictionary
                options[option_name] = option_value
                # Remove the matched option name-value pair from the option list
                option_list = option_list.replace(match.group(0), "", 1)

            break

    if command:
        return Options(command=command, kwargs=options)


def default_event():
    """
    Get the default event name.
    """
    if "GITHUB_EVENT_NAME" in os.environ:
        return os.environ["GITHUB_EVENT_NAME"]
    return ...


@app.command(help="Deploy a repository through DogeOps.")
def deploy(
    event: str = typer.Option(default_event(), "--event", "-e", help="The event name"),
    name: str = typer.Option("Dogefile", "--dogefile", "-d", help="The Dogefile name"),
    repo: Path = typer.Option(
        Path(".").resolve(), "--repo", "-r", help="The path to the local repository"
    ),
):
    """
    Trigger a deployment manually.
    """
    typer.secho(f"Using Dogefile: {name}", fg=typer.colors.BLUE)
    try:
        if deployment := submit_to_dogeops(event, name, repo):
            typer.secho(happy_message(deployment.progress_url), fg=typer.colors.GREEN)
    except (MuchError, ValueError) as err:
        typer.secho(sad_message(), fg=typer.colors.RED)
        typer.secho(f"Error: {err.args[0]}", fg=typer.colors.RED)
        return 1


def submit_to_dogeops(
    event: str, dogefile: str, repo: Path = None
) -> Optional[dm.Deployment]:
    """
    Trigger a deployment.
    Builds a context from the event and submits it to the API.
    """
    ctx = get_repo_context(event, repo)
    dogefile = get_dogefile((repo / dogefile).absolute())

    commit_message = ctx.commit.message
    options = parse_doge_options(commit_message)

    if "DOGEOPS_API_KEY" not in os.environ:
        raise MuchError("DOGEOPS_API_KEY not set")

    if "DOGEOPS_API_URL" not in os.environ:
        raise MuchError("DOGEOPS_API_URL not set")

    api = DogeApi(
        token=os.environ["DOGEOPS_API_KEY"],
        url=os.environ["DOGEOPS_API_URL"],
    )

    try:
        deployment = api.deploy(context=ctx, dogefile=dogefile, options=options)
        if not deployment:
            raise MuchError(f"{dogefile} does not exist")
    except HTTPError as he:
        raise MuchError(he.args[0])

    return deployment
