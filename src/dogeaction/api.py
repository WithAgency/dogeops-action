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

    def __make_deployment(  # noqa
        self,
        context: dict[str, Any],
        manifest: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "context": context,
            "manifest": manifest,
        }

    @api.post("api/deployment/", json=__make_deployment)
    def deploy(
        self,
        context: dict[str, Any],
        manifest: dict[str, Any],
    ) -> Deployment:
        pass
