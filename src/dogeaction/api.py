import os
from typing import Any, Optional

from typefit import api
from typefit.httpx_models import HeaderTypes

from dogeaction.models import Deployment


class DogeApi(api.SyncClient):

    BASE_URL = os.environ["DOGEOPS_API_URL"]

    def __init__(self, token: str):
        super().__init__()
        self._token = token

    def headers(self) -> Optional[HeaderTypes]:
        return {"X-API-KEY": self._token}

    @api.get("api/ping/")
    def ping(self) -> str:
        """Ping the API"""

    def __make_deployment(  # noqa
        self,
        spec: str,
        ctx: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "spec": spec,
            "ctx": ctx,
        }

    @api.post("api/deployment/", json=__make_deployment)
    def deploy(self, spec: str, ctx: dict[str, Any]) -> Deployment:
        pass
