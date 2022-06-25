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
class Committer:
    username: str
    email: str


@dataclass
class Commit:
    ref: str
    sha: str


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
    committer: Committer
    commit: Commit
    issue: Issue
    organization: Organization
    payload: Any


@dataclass
class DeploymentRequest:
    project: str
    context: Context
    manifest: dict[str, Any]


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
    project: str
    status: Status
    components: Optional[dict[str, Component]] = field(default_factory=dict)


@dataclass
class Project:
    id: str
    repo: str
