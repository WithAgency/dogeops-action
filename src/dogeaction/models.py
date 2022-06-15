from dataclasses import dataclass
from enum import Enum
from typing import Optional
from uuid import UUID


class Status(str, Enum):
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PENDING = "pending"


@dataclass
class Deployment:
    id: str
    status: Status
    logs: Optional[str] = None
