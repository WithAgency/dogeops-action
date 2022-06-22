from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Status(str, Enum):
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PENDING = "pending"


@dataclass
class Component:
    name: str
    url: str


@dataclass
class Deployment:
    id: str
    status: Status
    logs: Optional[str] = None
    components: Optional[list[Component]] = field(default_factory=list)
