from pathlib import Path

import yaml

from dogeaction.adapters.github import is_github_actions
from dogeaction.adapters.repository import get_repo_context


def is_ci() -> bool:
    """
    Check if the code is running in a CI environment.
    """
    return is_github_actions()


def get_dogefile(dogefile: Path):
    """
    Get the Dogefile as a parsed YAML object.
    """
    with open(dogefile) as man:
        spec = yaml.safe_load(man)

    return spec
