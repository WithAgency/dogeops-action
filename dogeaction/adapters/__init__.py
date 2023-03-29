import os
import re
from dataclasses import InitVar, dataclass
from pathlib import Path

from dogeaction.models.dogeops import Context


@dataclass
class GitUrls:
    """
    Utility class to parse git urls and convert between ssh and http urls.
    """

    url: InitVar[str]
    http: str = None
    ssh: str = None

    def __post_init__(self, url: str):
        """
        Parse the url and set the http and ssh urls.
        """
        if url.startswith("git@"):
            self.ssh = url
            self.http = self._to_http(url)
        else:
            self.http = url
            self.ssh = self._to_ssh(url)

    @staticmethod
    def _to_http(url) -> str:
        """
        Convert a git ssh url to a http url.
        """
        match = re.match(r"git@([^:]+):(.+).git", url)
        if match is None:
            raise ValueError(f"Could not parse git ssh url: {url}")
        host, path = match.groups()
        return f"https://{host}/{path}"

    @staticmethod
    def _to_ssh(url) -> str:
        """
        Convert a git http url to a ssh url.
        """
        match = re.match(r"https://([^/]+)/(.+).git", url)
        if match is None:
            raise ValueError(f"Could not parse git http url: {url}")
        host, path = match.groups()
        return f"git@{host}:{path}"


def make_context(event: str, repo: Path) -> Context:
    """
    Build a DogeOps context from the environment.
    When running in a GitHub Action, the context is built from the environment variables.
    When running locally, the context is built from the .git directory and properties.
    """
    if (repo / ".git").exists():
        from dogeaction.adapters.repository import from_git_repo
        from actions_toolkit import core
        core.info(f"from_git_repo {event} {repo}")
        return from_git_repo(event, repo)

    from dogeaction.adapters.github import from_github
    from actions_toolkit import core

    core.info(f"from_github {event} {repo}")

    ctx = from_github(event)
    core.info(f"ctx {ctx}")
    return ctx
