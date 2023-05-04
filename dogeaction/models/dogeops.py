from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

# -- Requests


@dataclass
class Repo:
    """
    Represents a git repository.
    """

    url: str


@dataclass
class Author:
    """
    Represents a collaborator to this repository. This is
    the information of the user whose actions triggered the call.
    """

    name: str
    email: str


@dataclass
class Commit:
    """
    Represents the commit information of the commit that triggered this call.
    """

    ref: str
    sha: str
    message: str


@dataclass
class Organization:
    """
    Represents the organization that owns the repository.
    """

    name: str
    id: Optional[str] = None


@dataclass
class Context:
    event: str
    repo: str
    author: Author
    commit: Commit
    payload: Optional[Any] = field(default_factory=dict)


@dataclass
class Options:
    command: Optional[str] = None
    kwargs: Optional[dict[str, Any]] = field(default_factory=dict)

    def __post_init__(self):
        if not self.command and self.kwargs:
            raise ValueError("Cannot specify kwargs without command")


@dataclass
class DeploymentRequest:
    context: Context
    dogefile: dict[str, Any]
    options: Options


# -- Responses


@dataclass
class Component:
    url: str


@dataclass
class Deployment:
    id: str
    status: str
    progress_url: str
    components: Optional[dict[str, Component]] = field(default_factory=dict)


@dataclass
class Project:
    id: str
    repo: str
