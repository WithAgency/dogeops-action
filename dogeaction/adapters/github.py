import os
from typing import Any, Optional

from actions_toolkit import github


def is_github_actions() -> bool:
    """
    Check if the code is running in a CI environment.
    """
    return os.environ.get("GITHUB_ACTIONS", "").lower() == "true"


def github_payload() -> Optional[Any]:
    """
    Get the GitHub payload.
    """
    if is_github_actions():
        return github.Context().payload
