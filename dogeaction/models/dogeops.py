from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

# -- Requests


@dataclass
class Repo:
    repo: str
    owner: str
    ref: str
    url: str


@dataclass
class Pusher:
    username: str
    email: str


@dataclass
class Commit:
    ref: str
    sha: str
    message: str


@dataclass
class Issue:
    owner: str
    repo: str
    number: Optional[int]


@dataclass
class Organization:
    name: str
    id: int


@dataclass
class Context:
    event: str
    repo: Repo
    pusher: Pusher
    commit: Commit
    organization: Organization
    payload: Any
    issue: Optional[Issue] = None


@dataclass
class Options:
    ignore: bool = False
    notify: bool = True


@dataclass
class DeploymentRequest:
    context: Context
    manifest: dict[str, Any]
    options: Options


# -- Responses


class Status(str, Enum):
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PENDING = "pending"
    WORKING = "working"


@dataclass
class Component:
    url: str


@dataclass
class Deployment:
    id: str
    status: Status
    progress_url: str
    components: Optional[dict[str, Component]] = field(default_factory=dict)


@dataclass
class Project:
    id: str
    repo: str
